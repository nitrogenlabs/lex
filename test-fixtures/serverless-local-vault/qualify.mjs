/* eslint-disable no-await-in-loop -- Each declared invocation completes before the next isolated command. */
import {createLocalHttpApiV2Event, createServerlessLocalRuntime, matchLocalHttpRoute} from '@nlabs/lex/serverless-local';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const bytes = readFileSync(new URL('./functions.json', import.meta.url));
const sha256 = createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256, 'bc6f3dc3c452169f84a490020cf7e37a3ed48fbde7c8eb834610fb940687a78e');
assert.equal(bytes.length, 18229);
const fixture = JSON.parse(bytes.toString('utf8'));
const echo = (name) => async (event, context) => ({event, name, version: context.functionVersion});
const loadHandler = async () => {
  throw new Error('Unexpected consumer module loading');
};
const runtime = await createServerlessLocalRuntime({bootstrap: () =>
  ({handlers: {ai: echo('ai'), core: echo('core')}}), functions: fixture.functions,
loadHandler, maxConcurrentInvocations: 2, now: () => 1000});
let invoked = 0;
try {
  assert.deepEqual(runtime.functions.map(({events, name}) => ({count: events.length, name})),
    [{count: 153, name: 'core'}, {count: 6, name: 'ai'}]);
  assert.deepEqual(runtime.functions[0].events, fixture.functions.core.events.map(({http}) => http));
  for(const [name, fn] of Object.entries(fixture.functions)) {
    for(const {http: {method, path}} of fn.events) {
      const requestPath = path.replace(/\{[^}]+\}/g, 'fixture');
      const target = `/production${requestPath}?x=1&x=2`;
      const selected = matchLocalHttpRoute(runtime.functions, method, target);
      assert.equal(selected?.name, name, `${method} ${path}`);
      const event = createLocalHttpApiV2Event({body: Buffer.from('{}'), headers: {}, method,
        sourceIp: '127.0.0.1', target}, selected.localInvocation);
      assert.equal(Object.hasOwn(event, 'routeKey'), false);
      assert.equal(Object.hasOwn(event, 'pathParameters'), false);
      assert.deepEqual(await runtime.invoke(name, event), {event: structuredClone(event), name, version: '17'});
      assert.equal(event.rawPath, `/production${requestPath}`);
      assert.equal(event.rawQueryString, 'x=1&x=2');
      invoked++;
    }
  }
} finally {
  await runtime.close();
}

const parent = '/api/universes/{universeId}/books/{bookId}/scenarios';
let specificityInvocations = 0;
for(const reverse of [false, true]) {
  const metadata = fixture.functions.core.localInvocation;
  const functions = {generic: {events: [{http: {method: 'GET', path: `${parent}/{scenarioId}`}}],
    handler: 'index.shared', localInvocation: metadata},
  specific: {events: [{http: {method: 'GET', path: `${parent}/checkpoint-plan`}}],
    handler: 'index.shared', localInvocation: metadata}};
  const entries = reverse ? Object.entries(functions).reverse() : Object.entries(functions);
  const instance = await createServerlessLocalRuntime({bootstrap: () =>
    ({handlers: {generic: echo('generic'), specific: echo('specific')}}),
  functions: Object.fromEntries(entries), loadHandler, maxConcurrentInvocations: 1, now: () => 1000});
  try {
    for(const [suffix, name] of [['checkpoint-plan', 'specific'], ['other', 'generic']]) {
      const target = `/production/api/universes/one/books/two/scenarios/${suffix}?x=1&x=2`;
      const selected = matchLocalHttpRoute(instance.functions, 'GET', target);
      assert.equal(selected?.name, name);
      const event = createLocalHttpApiV2Event({body: Buffer.alloc(0), headers: {}, method: 'GET',
        sourceIp: '127.0.0.1', target}, selected.localInvocation);
      assert.deepEqual(await instance.invoke(selected.name, event), {event: structuredClone(event), name, version: '17'});
      specificityInvocations++;
    }
  } finally {
    await instance.close();
  }
}
assert.equal(invoked, 159);
assert.equal(specificityInvocations, 4);
assert.equal(process.getActiveResourcesInfo().includes('TCPServerWrap'), false);
process.stdout.write(`${JSON.stringify({fixtureSha256: sha256, fixtureUtf8Bytes: bytes.length,
  invocations: invoked, routes: 159, specificityInvocations})}\n`);
