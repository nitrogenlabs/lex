import {afterEach, beforeEach, expect as publicExpect, test as publicTest, vi as publicVi} from '@nlabs/lex/test-vitest';
import {source, sum} from './subject.js';

import type {Assertion, Mock, MockInstance, TestContext} from '@nlabs/lex/test-vitest';

let hooks = 0;
beforeEach(() => {hooks += 1;});
afterEach(() => {
  publicVi.restoreAllMocks();
  publicVi.useRealTimers();
});

publicTest.each([{left: 2, right: 3, want: 5}])('preserves callback inference and clean node execution', ({left, right, want}) => {
  const inferredNumber: number = left;
  // @ts-expect-error each callbacks must not lose inference to any
  const invalid: string = left;
  publicExpect(sum(inferredNumber, right)).toBe(want);
  publicExpect(source()).toBe('real');
  publicExpect(hooks).toBeGreaterThan(0);
  publicExpect(typeof document).toBe('undefined');
  publicExpect(publicExpect).toBe(expect);
  publicExpect(publicVi).toBe(vi);
  publicExpect(publicTest).toBe(test);
  publicExpect(invalid).toBe(2);
});

publicTest('preserves public aliases, inferred spy callbacks and runner fake timers', async (context: TestContext) => {
  const object = {format: (value: number): string => String(value)};
  const spy: MockInstance<(value: number) => string> = publicVi.spyOn(object, 'format');
  spy.mockImplementation((value) => {
    const number: number = value;
    // @ts-expect-error spy callback must not become any
    const invalid: string = value;
    return `${number}:${invalid}`;
  });
  const assertion: Assertion<string> = publicExpect(object.format(2));
  assertion.toBe('2:2');
  const mock: Mock<(value: number) => string> = publicVi.fn((value) => String(value));
  publicExpect(mock(3)).toBe('3');
  publicExpect(context.task.name).toContain('public aliases');
  publicVi.useFakeTimers();
  const pending = new Promise<number>((resolve) => {setTimeout(() => resolve(7), 10);});
  await vi.advanceTimersByTimeAsync(10);
  await publicExpect(pending).resolves.toBe(7);
  publicExpect(vi.getTimerCount()).toBe(0);
});
