import * as bindings from '@nlabs/lex/test-vitest';

import {afterEach, expect, test, vi} from './index.js';

import type {Mock} from '@nlabs/lex/test-vitest';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test('public bindings share the running framework mock state and public callback types', async () => {
  expect(bindings.expect).toBe(expect);
  expect(bindings.vi).toBe(vi);

  const mock: Mock<(value: number) => Promise<string>> = bindings.vi.fn(async (value) => String(value));

  await expect(mock(7)).resolves.toBe('7');
  expect(mock).toHaveBeenCalledExactlyOnceWith(7);
});

test('public fake clocks settle async work and support cleanup through the running framework', async () => {
  bindings.vi.useFakeTimers();
  const completed = bindings.vi.fn();
  const work = new Promise<void>((resolve) => {
    setTimeout(() => {
      completed();
      resolve();
    }, 10);
  });
  await vi.advanceTimersByTimeAsync(10);
  await work;

  expect(completed).toHaveBeenCalledOnce();
  expect(bindings.vi.getTimerCount()).toBe(0);
});

test('public spies and assertions capture warnings and async rejection without leaked console output', async () => {
  const warn = bindings.vi.spyOn(console, 'warn').mockImplementation(() => {});
  // eslint-disable-next-line no-console -- Exercise the public spy without emitting console output.
  console.warn('fixture warning');

  expect(warn).toHaveBeenCalledWith('fixture warning');

  const fail = bindings.vi.fn(async () => {
    throw new Error('fixture failure');
  });

  await bindings.expect(fail()).rejects.toThrow('fixture failure');
});
