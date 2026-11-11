import {describe, expect, it} from 'vitest';

import {captureLocalFunctions, createLocalHttpApiV2Event, localHttpResponse, matchLocalHttpRoute} from './http.js';

const localInvocation = {accountId: '123456789012', apiId: 'local-test', functionArn: 'arn:aws:lambda:us-east-1:123456789012:function:core:17', payloadVersion: '2.0' as const, region: 'us-east-1', stage: 'local', timeoutMs: 30000};
const functions = () => ({core: {events: [{http: {method: 'GET', path: '/books/{book}'}}], handler: 'index.core', localInvocation}});

describe('explicit local HTTP API v2', () => {
  it('retains raw body, encoded path, duplicate query text and opaque cookies', () => {
    const event = createLocalHttpApiV2Event({body: Buffer.from('{ "a": 1 }\n'), headers: {connection: 'keep-alive', cookie: 'session=secret; other=x', origin: 'https://local.test'}, method: 'POST', sourceIp: '127.0.0.1', target: '/local/books/A%20B?x=1&x=2'}, localInvocation);

    expect(event).toMatchObject({body: Buffer.from('{ "a": 1 }\n').toString('base64'), cookies: ['session=secret', 'other=x'], headers: {origin: 'https://local.test'}, isBase64Encoded: true, rawPath: '/local/books/A%20B', rawQueryString: 'x=1&x=2', requestContext: {accountId: '123456789012', apiId: 'local-test', http: {method: 'POST', path: '/local/books/A%20B', sourceIp: '127.0.0.1'}, stage: 'local'}, version: '2.0'});
    expect(event.headers).not.toHaveProperty('connection');
    expect(event.headers).not.toHaveProperty('cookie');
  });

  it('matches exact routes before templates and preserves configured stage boundaries', () => {
    const captured = captureLocalFunctions({...functions(), index: {events: [{http: {method: 'GET', path: '/books/index'}}], handler: 'index.list', localInvocation}});

    expect(matchLocalHttpRoute(captured, 'GET', '/local/books/index?x=1')?.name).toBe('index');
    expect(matchLocalHttpRoute(captured, 'GET', '/books/A%20B')?.name).toBe('core');
    expect(matchLocalHttpRoute(captured, 'GET', '/other/books/A')).toBeUndefined();
    expect(matchLocalHttpRoute(captured, 'POST', '/books/A')).toBeUndefined();
    expect(matchLocalHttpRoute(captured, 'GET', '/books/A/extra')).toBeUndefined();
  });

  it('ignores legacy functions and captures configuration before caller edits', () => {
    const input = {...functions(), legacy: {events: [{http: {method: 'GET', path: '/old'}}], handler: 'index.old'}};
    const captured = captureLocalFunctions(input);
    input.core.events[0].http.path = '/changed';

    expect(matchLocalHttpRoute(captured, 'GET', '/books/a')?.name).toBe('core');
    expect(matchLocalHttpRoute(captured, 'GET', '/old')).toBeUndefined();
  });

  it.each([{functionArn: 'arn:aws:lambda:us-east-1:123456789012:function:core:$LATEST'}, {region: 'us-west-2'}, {accountId: '000000000000'}, {timeoutMs: 0}, {stage: ''}, {payloadVersion: '1.0'}, {apiId: 'bad api'}, {providerKey: 'secret'}])('rejects invalid explicit metadata %j', (edit) => {
    const configuration = {core: {...functions().core, localInvocation: {...localInvocation, ...edit}}};

    expect(() => captureLocalFunctions(configuration as never)).toThrow('Invalid local function configuration');
  });

  it('refuses ambiguous template routes before startup', () => {
    expect(() => captureLocalFunctions({...functions(), second: {events: [{http: {method: 'GET', path: '/books/{id}'}}], handler: 'index.second', localInvocation}})).toThrow('Ambiguous local HTTP route');
  });

  it('refuses crossing template overlaps independently of declaration order', () => {
    const entries = {...functions(), second: {events: [{http: {method: 'GET', path: '/{kind}/index'}}], handler: 'index.second', localInvocation}};

    expect(() => captureLocalFunctions(entries)).toThrow('Ambiguous local HTTP route');
    expect(() => captureLocalFunctions(Object.fromEntries(Object.entries(entries).reverse()))).toThrow('Ambiguous local HTTP route');
  });

  it.each([false, true])('admits strict static domination below parent parameters in reverse order %s', (reverse) => {
    const base = '/api/universes/{universeId}/books/{bookId}/scenarios';
    const entries = {generic: {events: [{http: {method: 'GET', path: `${base}/{scenarioId}`}}], handler: 'index.generic', localInvocation},
      specific: {events: [{http: {method: 'GET', path: `${base}/checkpoint-plan`}}], handler: 'index.specific', localInvocation}};
    const ordered = reverse ? Object.entries(entries).reverse() : Object.entries(entries);
    const captured = captureLocalFunctions(Object.fromEntries(ordered));

    expect(matchLocalHttpRoute(captured, 'GET', '/api/universes/one/books/two/scenarios/checkpoint-plan')?.name).toBe('specific');
    expect(matchLocalHttpRoute(captured, 'GET', '/local/api/universes/one/books/two/scenarios/checkpoint-plan?x=1&x=2')?.name).toBe('specific');
    expect(matchLocalHttpRoute(captured, 'GET', '/api/universes/one/books/two/scenarios/other')?.name).toBe('generic');
  });

  it('refuses incomparable overlapping patterns even when one has more literal segments', () => {
    const entries = {first: {events: [{http: {method: 'GET', path: '/a/{x}/{z}'}}], handler: 'index.first', localInvocation},
      second: {events: [{http: {method: 'GET', path: '/{y}/b/fixed'}}], handler: 'index.second', localInvocation}};

    expect(() => captureLocalFunctions(entries)).toThrow('Ambiguous local HTTP route');
    expect(() => captureLocalFunctions(Object.fromEntries(Object.entries(entries).reverse()))).toThrow('Ambiguous local HTTP route');
  });

  it.each([
    {method: 'GET', paths: ['/chapters/{chapterId}/revision/flow1/{pipelineId}', '/chapters/{chapterId}/{flow}/{jobDirectory}/meta.json']},
    {method: 'GET', paths: ['/chapters/{chapterId}/revision/flow2/{pipelineId}', '/chapters/{chapterId}/{flow}/{jobDirectory}/meta.json']},
    {method: 'PUT', paths: ['/scenarios/checkpoints/{checkpointId}', '/scenarios/{scenarioId}/continuity-review']}
  ])('leaves same-function domain ordering intact for $method $paths but refuses cross-key ambiguity', ({method, paths}) => {
    const events = paths.map((path) => ({http: {method, path}}));
    const entry = {events, handler: 'index.shared', localInvocation};
    const captured = captureLocalFunctions({core: entry});

    expect(captured[0].events).toEqual(events.map(({http}) => http));

    const differentKeys = {core: {...entry, events: [events[0]]}, other: {...entry, events: [events[1]]}};

    expect(() => captureLocalFunctions(differentKeys)).toThrow('Ambiguous local HTTP route');
    expect(() => captureLocalFunctions(Object.fromEntries(Object.entries(differentKeys).reverse())))
      .toThrow('Ambiguous local HTTP route');
  });

  it('refuses normalized duplicates within one function binding', () => {
    const entry = functions().core;
    entry.events.push({http: {method: 'GET', path: '/books/{other}'}});

    expect(() => captureLocalFunctions({core: entry})).toThrow('Ambiguous local HTTP route');
  });

  it('writes cookies and exact decoded private bytes without exposing an encoded envelope', () => {
    const bytes = Buffer.from([0, 255, 1, 128]);
    const response = localHttpResponse({body: bytes.toString('base64'), cookies: ['__Host-session=secret; HttpOnly; Secure', '__Host-other=x; Secure'], headers: {'content-type': 'application/octet-stream'}, isBase64Encoded: true, statusCode: 206});

    expect(response).toEqual({body: bytes, headers: {'content-type': 'application/octet-stream', 'set-cookie': ['__Host-session=secret; HttpOnly; Secure', '__Host-other=x; Secure']}, statusCode: 206});
  });

  it('retains plain empty responses and rejects malformed binary/cookies/status', () => {
    expect(localHttpResponse({statusCode: 204})).toEqual({body: Buffer.alloc(0), headers: {}, statusCode: 204});

    for(const response of [{body: 'invalid!', isBase64Encoded: true}, {cookies: ['a\r\nb']}, {statusCode: 999}, {headers: {'x-test': 'bad\nvalue'}}, {body: {}}, null]) {
      expect(() => localHttpResponse(response)).toThrow('Invalid local HTTP response');
    }
  });

  it('retains duplicate wire header evidence using HTTP API v2 comma joining', () => {
    const event = createLocalHttpApiV2Event({body: Buffer.alloc(0), headers: {'content-type': 'application/json'}, method: 'POST', rawHeaders: ['Content-Type', 'application/json', 'content-type', 'text/plain', 'Cookie', 'a=1', 'cookie', 'b=2'], sourceIp: '127.0.0.1', target: '/api'}, localInvocation);

    expect(event.headers['content-type']).toBe('application/json,text/plain');
    expect(event.cookies).toEqual(['a=1', 'b=2']);
  });

  it('retains opaque cookie arrays and prototype-like wire header names', () => {
    const event = createLocalHttpApiV2Event({body: Buffer.alloc(0), headers: {cookie: ['a=1', 'b=2']}, method: 'POST', sourceIp: '127.0.0.1', target: '/api'}, localInvocation);

    expect(event.cookies).toEqual(['a=1', 'b=2']);

    const wire = createLocalHttpApiV2Event({body: Buffer.alloc(0), headers: {}, method: 'GET', rawHeaders: ['constructor', 'first', '__proto__', 'second'], sourceIp: '127.0.0.1', target: '/api'}, localInvocation);

    expect(wire.headers).toEqual({['__proto__']: 'second', constructor: 'first'});
    expect(localHttpResponse({headers: {['__proto__']: 'second', constructor: 'first'}}).headers).toEqual({['__proto__']: 'second', constructor: 'first'});
  });
});
