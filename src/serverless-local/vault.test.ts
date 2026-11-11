import {expect, test, vi} from 'vitest';

import fixture from '../../test-fixtures/serverless-local-vault/functions.json' with {type: 'json'};
import {createLocalHttpApiV2Event, createServerlessLocalRuntime, matchLocalHttpRoute} from './index.js';

import type {LocalFunctionDeclaration, LocalInvocationContext} from './index.js';

// Exact copied data is validated by the public runtime; no routes or invocation identities are rewritten.
const functions = fixture.functions as Readonly<Record<string, LocalFunctionDeclaration>>;

test('public runtime admits all159 actual Vault events without filtering before bootstrap', async () => {
  const bootstrap = vi.fn(async () => ({handlers: {ai: async () => null, core: async () => null}}));
  const runtime = await createServerlessLocalRuntime({bootstrap, functions, loadHandler: vi.fn(),
    maxConcurrentInvocations: 2, now: () => 1000});

  expect(runtime.functions.map(({events, name}) => ({count: events.length, name})))
    .toEqual([{count: 153, name: 'core'}, {count: 6, name: 'ai'}]);
  expect(runtime.functions.flatMap(({events}) => events)).toHaveLength(159);
  expect(runtime.functions[0].events).toEqual(fixture.functions.core.events.map(({http}) => http));
  expect(bootstrap).toHaveBeenCalledOnce();

  await runtime.close();
});

test.each([
  {method: 'GET', path: '/api/universes/one/books/two/scenarios/checkpoint-plan', role: 'core'},
  {method: 'GET', path: '/api/universes/one/books/two/scenarios/other', role: 'core'},
  {method: 'POST', path: '/api/universes/one/books/two/chapters/three/outline/from-chapter', role: 'ai'}
])('public Vault fixture invokes $role for $method $path with unchanged raw target', async ({method, path, role}) => {
  const target = `/production${path}?x=1&x=2`;
  const handler = (name: string) => async (event: unknown, context: LocalInvocationContext) =>
    ({event, name, version: context.functionVersion});
  const runtime = await createServerlessLocalRuntime({bootstrap: async () =>
    ({handlers: {ai: handler('ai'), core: handler('core')}}), functions, loadHandler: vi.fn(),
  maxConcurrentInvocations: 2, now: () => 1000});
  const selected = matchLocalHttpRoute(runtime.functions, method, target)!;
  const event = createLocalHttpApiV2Event({body: Buffer.from('{}'), headers: {}, method,
    sourceIp: '127.0.0.1', target}, selected.localInvocation);

  expect(selected.name).toBe(role);
  expect(await runtime.invoke(selected.name, event)).toMatchObject({event: {body: 'e30=',
    rawPath: `/production${path}`, rawQueryString: 'x=1&x=2'}, name: role, version: '17'});
  expect(event).not.toHaveProperty('routeKey');
  expect(event).not.toHaveProperty('pathParameters');

  await runtime.close();
});
