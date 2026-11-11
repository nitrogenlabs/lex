import express from 'express';
import {Readable} from 'node:stream';
import {gzipSync} from 'node:zlib';
import {expect, test, vi} from 'vitest';

import {createServerlessLocalRuntime} from '../../serverless-local/runtime.js';
import {createLocalHttpMiddleware, createLocalExportLoader, initializeLocalRuntime} from './localHttp.js';

const localInvocation = {accountId: '123456789012', apiId: 'local', functionArn: 'arn:aws:lambda:us-east-1:123456789012:function:core:17', payloadVersion: '2.0' as const, region: 'us-east-1', stage: 'local', timeoutMs: 30000};
const request = () => ({body: Buffer.from('{ "secret":true }'), headers: {cookie: 'opaque=secret'}, method: 'POST', originalUrl: '/books/One%20Two?x=1&x=2', socket: {remoteAddress: '127.0.0.1'}});
const response = () => {
  const result = {end: vi.fn(), setHeader: vi.fn(), status: vi.fn(), statusCode: 200};
  result.status.mockReturnValue(result);
  return result;
};

test('routes raw opted-in requests through the captured function and writes opaque cookies/binary', async () => {
  const runtime = await createServerlessLocalRuntime({functions: {core: {events: [{http: {method: 'POST', path: '/books/{book}'}}], handler: 'index.core', localInvocation}}, loadHandler: async () => async (event) => {
    expect(event).toMatchObject({body: Buffer.from('{ "secret":true }').toString('base64'), cookies: ['opaque=secret'], rawPath: '/books/One%20Two', rawQueryString: 'x=1&x=2'});

    return {body: 'AP8=', cookies: ['__Host-session=opaque; HttpOnly; Secure'], isBase64Encoded: true, statusCode: 201};
  }, maxConcurrentInvocations: 1});
  const raw = vi.fn((req, res, next) => next());
  const middleware = createLocalHttpMiddleware(runtime, raw);
  const res = response();
  await middleware(request(), res, vi.fn());

  expect(raw).toHaveBeenCalledOnce();
  expect(res.statusCode).toBe(201);
  expect(res.setHeader).toHaveBeenCalledWith('set-cookie', ['__Host-session=opaque; HttpOnly; Secure']);
  expect(res.end).toHaveBeenCalledWith(Buffer.from([0, 255]));

  await runtime.close();
});

test('leaves legacy requests unparsed and sanitizes parser and handler failures', async () => {
  const runtime = await createServerlessLocalRuntime({functions: {core: {events: [{http: {method: 'POST', path: '/books/{book}'}}], handler: 'index.core', localInvocation}}, loadHandler: async () => async () => {
    throw new Error('secret-credential');
  }, maxConcurrentInvocations: 1});
  const next = vi.fn();
  const raw = vi.fn((req, res, done) => done());
  const middleware = createLocalHttpMiddleware(runtime, raw);
  await middleware({...request(), originalUrl: '/legacy'}, response(), next);

  expect(next).toHaveBeenCalledOnce();
  expect(raw).not.toHaveBeenCalled();

  const res = response();
  await middleware(request(), res, next);

  expect(res.statusCode).toBe(503);
  expect(res.end).toHaveBeenCalledWith('{"error":"Local invocation unavailable"}');

  const refused = response();
  await createLocalHttpMiddleware(runtime, (req, target, done) => done(new Error('secret parser')))(request(), refused, next);

  expect(refused.statusCode).toBe(400);
  expect(refused.end).toHaveBeenCalledWith('{"error":"Invalid local request"}');

  await runtime.close();
});

test('loads named compiled exports through an injected module boundary with sanitized failures', async () => {
  const handler = vi.fn();
  const importer = vi.fn(async () => ({core: handler}));
  const load = createLocalExportLoader('/synthetic/build', importer);

  expect(await load('modules/index.core')).toBe(handler);
  expect(importer).toHaveBeenCalledWith('file:///synthetic/build/modules/index.js');
  await expect(load('modules/index.missing')).rejects.toThrow('Local module export unavailable');

  const broken = createLocalExportLoader('/synthetic/build', async () => {
    throw new Error('secret import');
  });

  await expect(broken('index.core')).rejects.toThrow('Local module export unavailable');
});

test('loads explicit bootstrap before HTTP startup and leaves v1-only configurations untouched', async () => {
  const worker = vi.fn(async () => ({body: 'ok', statusCode: 200}));
  const close = vi.fn();
  const bootstrap = vi.fn(async () => ({close, handlers: {core: worker}}));
  const load = vi.fn(async () => bootstrap);
  const config = {functions: {core: {handler: 'index.core', localInvocation}}, local: {bootstrap: 'bootstrap.create', maxConcurrentInvocations: 1}};
  const runtime = await initializeLocalRuntime(config, load);

  expect(load).toHaveBeenCalledWith('bootstrap.create');
  expect(await runtime!.invoke('core', {})).toEqual({body: 'ok', statusCode: 200});

  await runtime!.close();

  expect(close).toHaveBeenCalledOnce();
  expect(await initializeLocalRuntime({functions: {legacy: {handler: 'index.legacy'}}}, load)).toBeUndefined();
  await expect(initializeLocalRuntime({functions: config.functions}, load)).rejects.toThrow('Explicit local invocation configuration required');
});

test('loads opted-in handlers without bootstrap and retains an empty raw request', async () => {
  const load = vi.fn(async () => async (event) => {
    expect(event).toMatchObject({body: '', cookies: ['opaque=secret']});

    return {statusCode: 204};
  });
  const runtime = await initializeLocalRuntime({functions: {core: {events: [{http: {method: 'POST', path: '/books/{book}'}}], handler: 'index.core', localInvocation}}, local: {maxConcurrentInvocations: 1}}, load);
  const res = response();
  const middleware = createLocalHttpMiddleware(runtime!, (req, target, next) => next());
  await middleware({...request(), body: undefined}, res, vi.fn());

  expect(res.statusCode).toBe(204);
  expect(res.end).toHaveBeenCalledWith(Buffer.alloc(0));
  expect(load).toHaveBeenCalledWith('index.core');

  await runtime!.close();
});

test.each(['nonraw', 'thrown'])('rejects %s parser failure before invocation', async (mode) => {
  const load = vi.fn();
  const runtime = await initializeLocalRuntime({functions: {core: {events: [{http: {method: 'POST', path: '/books/{book}'}}], handler: 'index.core', localInvocation}}, local: {maxConcurrentInvocations: 1}}, load);
  const raw = (req, res, next) => {
    if(mode === 'thrown') {
      throw new Error('secret parser');
    }
    req.body = {};
    next();
  };
  const res = response();
  await createLocalHttpMiddleware(runtime!, raw)(request(), res, vi.fn());

  expect(res.statusCode).toBe(400);
  expect(res.end).toHaveBeenCalledWith('{"error":"Invalid local request"}');
  expect(load).not.toHaveBeenCalled();

  await runtime!.close();
});

test('requires a socket source address and explicit module export', async () => {
  const runtime = await initializeLocalRuntime({functions: {core: {events: [{http: {method: 'POST', path: '/books/{book}'}}], handler: 'index.core', localInvocation}}, local: {maxConcurrentInvocations: 1}}, vi.fn());
  const res = response();
  await createLocalHttpMiddleware(runtime!, (req, target, next) => next())({...request(), socket: {}}, res, vi.fn());

  expect(res.statusCode).toBe(503);

  const load = createLocalExportLoader('/synthetic', vi.fn(async () => ({named: () => null})));

  expect(await load('index.mjs.named')).toBeTypeOf('function');
  await expect(load('index')).rejects.toThrow('Local module export unavailable');
  await expect(load('index.')).rejects.toThrow('Local module export unavailable');

  await runtime!.close();
});

test('retains compressed request bytes with the actual bounded raw parser', async () => {
  const bytes = gzipSync(Buffer.from('{ "value":1 }'));
  const runtime = await initializeLocalRuntime({functions: {core: {events: [{http: {method: 'POST', path: '/books/{book}'}}], handler: 'index.core', localInvocation}}, local: {maxConcurrentInvocations: 1}}, async () => async (event) => {
    expect(event).toMatchObject({body: bytes.toString('base64'), headers: {'content-encoding': 'gzip'}});

    return {statusCode: 204};
  });
  const req = Readable.from([bytes]) as Readable & {headers: Record<string, string>; method: string;
    originalUrl: string; socket: {remoteAddress: string};};
  req.headers = {'content-encoding': 'gzip', 'content-length': String(bytes.length)};
  req.method = 'POST';
  req.originalUrl = '/books/one';
  req.socket = {remoteAddress: '127.0.0.1'};
  const res = response();
  await createLocalHttpMiddleware(runtime!, express.raw({inflate: false, limit: '1kb', type: () => true}) as never)(req, res, vi.fn());

  expect(res.statusCode).toBe(204);
  expect(req.headers['content-encoding']).toBe('gzip');

  await runtime!.close();
});
