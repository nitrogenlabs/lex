import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';

import {log} from '../../utils/log.js';
import {serverlessDev} from './serverless-dev.js';

type MockApp = {get: ReturnType<typeof vi.fn>; listen: ReturnType<typeof vi.fn>;
  locals: Record<string, () => Promise<void>>; post: ReturnType<typeof vi.fn>; use: ReturnType<typeof vi.fn>;};
type MockListener = {close: ReturnType<typeof vi.fn>; on: ReturnType<typeof vi.fn>};
const state = vi.hoisted(() => ({app: undefined as MockApp | undefined, directory: '', failWebSocket: false,
  http: undefined as MockListener | undefined, runListening: false,
  signals: new Map<string, () => void>(), websocket: undefined as MockListener | undefined}));
let originalEnvironment: NodeJS.ProcessEnv;

vi.mock('../../LexConfig.js', () => ({LexConfig: {get config() {
  return {outputFullPath: state.directory};
}, parseConfig: vi.fn()}, getPackageDir: () => state.directory}));
vi.mock('../../utils/app.js', () => ({createSpinner: () => ({fail: vi.fn(), start: vi.fn(), succeed: vi.fn()}), removeFiles: vi.fn()}));
vi.mock('../../utils/log.js', () => ({log: vi.fn()}));
vi.mock('ws', () => ({WebSocketServer: class {
  close = vi.fn();
  on = vi.fn();
  constructor() {
    if(state.failWebSocket) {
      throw new Error('private-websocket-error');
    }
    state.websocket = this;
  }
}}));
vi.mock('express', () => {
  const express = () => {
    state.http = {close: vi.fn(), on: vi.fn()};
    state.app = {get: vi.fn(), listen: vi.fn((port, host, callback) => {
      if(state.runListening) {
        callback();
      }
      return state.http;
    }), locals: {},
    post: vi.fn(), use: vi.fn()};
    return state.app;
  };
  express.raw = () => (request, response, next) => next();
  express.json = () => (request, response, next) => next();
  return {default: express};
});

beforeEach(async () => {
  originalEnvironment = {...process.env};
  state.directory = await mkdtemp(join(tmpdir(), 'lex-local-unit-'));
  state.app = undefined;
  vi.spyOn(process, 'cwd').mockReturnValue(state.directory);
  state.failWebSocket = false;
  state.runListening = false;
  state.signals.clear();
  vi.spyOn(process, 'on').mockImplementation(((signal, listener) => {
    state.signals.set(signal, listener);
    return process;
  }) as typeof process.on);
  vi.spyOn(process.stdin, 'resume').mockReturnValue(process.stdin);
  vi.stubGlobal('fetch', vi.fn(async () => {
    throw new Error('Unexpected unit network');
  }));
  vi.clearAllMocks();
});

afterEach(async () => {
  await state.app?.locals.closeServerlessLocalRuntime?.();
  await rm(state.directory, {force: true, recursive: true});
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  process.env = originalEnvironment;
});

test('command starts the opted-in raw boundary and drains injected bootstrap on shutdown', async () => {
  const metadata = {accountId: '123456789012', apiId: 'local', functionArn: 'arn:aws:lambda:us-east-1:123456789012:function:core:17', payloadVersion: '2.0', region: 'us-east-1', stage: 'local', timeoutMs: 30000};
  const config = {serverless: {functions: {core: {events: [{http: {method: 'POST', path: '/books/{id}'}}], handler: 'index.core', localInvocation: metadata}}, local: {bootstrap: 'bootstrap.create', maxConcurrentInvocations: 2}}};
  await writeFile(join(state.directory, 'lex.config.mjs'), `export default ${JSON.stringify(config)}`);
  await writeFile(join(state.directory, 'bootstrap.js'), 'export const create = () => ({handlers:{core:async(event,context)=>({body:JSON.stringify({event,version:context.functionVersion}),statusCode:200})},close:()=>{}});');
  const callback = vi.fn();

  expect(await serverlessDev({quiet: true}, callback)).toBe(0);

  const raw = state.app.use.mock.calls[0][0];
  const res = {end: vi.fn(), setHeader: vi.fn(), statusCode: 200};
  await raw({body: Buffer.from('{ "a":1 }'), headers: {cookie: 'session=private'}, method: 'POST', originalUrl: '/books/One%20Two?x=1&x=2', socket: {remoteAddress: '127.0.0.1'}}, res, vi.fn());

  expect(JSON.parse(res.end.mock.calls[0][0].toString())).toMatchObject({event: {body: Buffer.from('{ "a":1 }').toString('base64'), cookies: ['session=private'], rawPath: '/books/One%20Two', rawQueryString: 'x=1&x=2'}, version: '17'});

  state.signals.get('SIGTERM')!();
  await state.app.locals.closeServerlessLocalRuntime();

  expect(callback).toHaveBeenCalledWith(0);
  expect(fetch).not.toHaveBeenCalled();
});

test('bootstrap refusal is sanitized and prevents opening a server', async () => {
  await writeFile(join(state.directory, 'lex.config.mjs'), 'export default {serverless:{local:{bootstrap:"bootstrap.create",maxConcurrentInvocations:1}}};');
  await writeFile(join(state.directory, 'bootstrap.js'), 'export const create=()=>{throw new Error("private-password")};');
  const callback = vi.fn();

  expect(await serverlessDev({quiet: true}, callback)).toBe(1);
  expect(state.app.listen).not.toHaveBeenCalled();
  expect(callback).toHaveBeenCalledWith(1);
  expect(JSON.stringify(vi.mocked(log).mock.calls)).not.toContain('private-password');
});

test('later server startup failure closes bootstrap resources and sanitizes diagnostics', async () => {
  state.failWebSocket = true;
  await writeFile(join(state.directory, 'lex.config.mjs'), 'export default {serverless:{local:{bootstrap:"bootstrap.create",maxConcurrentInvocations:1}}};');
  const file = join(state.directory, 'bootstrap.js');
  await writeFile(file, 'export let closed=0; export const create=()=>({handlers:{},close:()=>{closed++}});');

  expect(await serverlessDev({quiet: true}, vi.fn())).toBe(1);

  const module = await import(pathToFileURL(file).href);

  expect(module.closed).toBe(1);
  expect(JSON.stringify(vi.mocked(log).mock.calls)).not.toContain('private-websocket-error');
});

test('unmatched opted-in requests do not log their query, cookies or body', async () => {
  await writeFile(join(state.directory, 'lex.config.mjs'), 'export default {serverless:{local:{maxConcurrentInvocations:1}}};');

  expect(await serverlessDev({quiet: true}, vi.fn())).toBe(0);

  const logging = vi.spyOn(console, 'log').mockImplementation(() => {});
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  const fallback = state.app!.use.mock.calls.find(([path]) => path === '/')[1];
  const res = {json: vi.fn(), status: vi.fn()};
  res.status.mockReturnValue(res);
  await fallback({body: {secret: 'private-body'}, headers: {cookie: 'opaque-private'}, method: 'GET', path: '/unknown', url: '/unknown?token=private-query'}, res);

  expect(res.status).toHaveBeenCalledWith(404);
  expect(logging).not.toHaveBeenCalled();
  expect(errors).not.toHaveBeenCalled();
});

test('evaluates an explicit configuration factory once after dotenv and CLI precedence', async () => {
  process.env.LEX_LOCAL_TEST_API = 'ambient';
  await writeFile(join(state.directory, '.env'), 'LEX_LOCAL_TEST_API=base');
  await writeFile(join(state.directory, '.env.local'), 'LEX_LOCAL_TEST_API=local');
  await writeFile(join(state.directory, '.env.development'), 'LEX_LOCAL_TEST_API=development');
  const file = join(state.directory, 'lex.config.mjs');
  process.env.LEX_LOCAL_FACTORY_COUNT = join(state.directory, 'count');
  await writeFile(file, 'import {appendFileSync} from \'node:fs\'; export default {serverless:environment=>{appendFileSync(environment.LEX_LOCAL_FACTORY_COUNT,\'x\'); if(!Object.isFrozen(environment))throw new Error(\'mutable environment\'); return {functions:{core:{events:[{http:{method:\'POST\',path:\'/factory\'}}],handler:\'index.core\',localInvocation:{accountId:\'123456789012\',apiId:environment.LEX_LOCAL_TEST_API,functionArn:\'arn:aws:lambda:us-east-1:123456789012:function:core:17\',payloadVersion:\'2.0\',region:\'us-east-1\',stage:\'local\',timeoutMs:30000}}},local:{maxConcurrentInvocations:1}}}};');
  await writeFile(join(state.directory, 'index.js'), 'export const core=event=>({body:event.requestContext.apiId,statusCode:200});');

  expect(await serverlessDev({quiet: true, variables: '{"LEX_LOCAL_TEST_API":"cli"}'}, vi.fn())).toBe(0);
  expect(await readFile(process.env.LEX_LOCAL_FACTORY_COUNT, 'utf8')).toBe('x');
  expect(process.env.LEX_LOCAL_TEST_API).toBe('cli');
  expect(state.app!.listen).toHaveBeenCalledOnce();

  const res = {end: vi.fn(), setHeader: vi.fn(), statusCode: 200};
  await state.app!.use.mock.calls[0][0]({headers: {}, method: 'POST', originalUrl: '/factory', socket: {remoteAddress: '127.0.0.1'}}, res, vi.fn());

  expect(res.end).toHaveBeenCalledWith(Buffer.from('cli'));
});

test.each(['throw', 'invalid', 'uncloneable'])('factory %s refuses startup with sanitized diagnostics', async (mode) => {
  const results = {invalid: 'return null', throw: 'throw new Error("private-factory")', uncloneable: 'return {callback:()=>{}}'};
  const result = results[mode];
  await writeFile(join(state.directory, 'lex.config.mjs'), `export default {serverless:()=>{${result}}};`);
  const callback = vi.fn();

  expect(await serverlessDev({quiet: true}, callback)).toBe(1);
  expect(state.app).toBeUndefined();
  expect(callback).toHaveBeenCalledWith(1);
  expect(JSON.stringify(vi.mocked(log).mock.calls)).not.toContain('private-factory');
});

test.each(['http', 'websocket'] as const)('%s listener error closes both listeners and bootstrap once', async (channel) => {
  const metadata = {accountId: '123456789012', apiId: 'local', functionArn: 'arn:aws:lambda:us-east-1:123456789012:function:core:17', payloadVersion: '2.0', region: 'us-east-1', stage: 'local', timeoutMs: 30000};
  await writeFile(join(state.directory, 'lex.config.mjs'), `export default ${JSON.stringify({serverless: {functions: {core: {events: [{http: {method: 'POST', path: '/close'}}], handler: 'index.core', localInvocation: metadata}}, local: {bootstrap: 'bootstrap.create', maxConcurrentInvocations: 1}}})};`);
  const file = join(state.directory, 'bootstrap.js');
  await writeFile(file, 'export let closed=0; export const create=()=>({handlers:{core:async()=>({statusCode:204})},close:()=>{closed++}});');
  const done = Promise.withResolvers<number>();
  const callback = vi.fn((status: number) => done.resolve(status));

  expect(await serverlessDev({quiet: true}, callback)).toBe(0);

  const fail = state[channel]!.on.mock.calls.find(([event]) => event === 'error')[1];
  fail(new Error('private-listener'));

  expect(await done.promise).toBe(1);
  expect(state.http!.close).toHaveBeenCalledOnce();
  expect(state.websocket!.close).toHaveBeenCalledOnce();

  const module = await import(pathToFileURL(file).href);

  expect(module.closed).toBe(1);

  fail(new Error('second-private-listener'));

  expect(callback).toHaveBeenCalledOnce();

  const res = {end: vi.fn(), setHeader: vi.fn(), statusCode: 200};
  await state.app!.use.mock.calls[0][0]({headers: {}, method: 'POST', originalUrl: '/close', socket: {remoteAddress: '127.0.0.1'}}, res, vi.fn());

  expect(res.statusCode).toBe(503);
  expect(JSON.stringify(vi.mocked(log).mock.calls)).not.toContain('private-listener');
});

test('opted-in listening skips public-IP requests and display timers by default', async () => {
  state.runListening = true;
  await writeFile(join(state.directory, 'lex.config.mjs'), 'export default {serverless:{local:{maxConcurrentInvocations:1}}};');
  vi.useFakeTimers();

  expect(await serverlessDev({quiet: true}, vi.fn())).toBe(0);
  expect(fetch).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});
