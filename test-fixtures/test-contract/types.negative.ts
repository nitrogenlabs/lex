import '@nlabs/lex/test-react';
import {expect, test, vi} from '@nlabs/lex/test-vitest';

import type {MockInstance} from '@nlabs/lex/test-vitest';

test.each([{value: 1}])('invalid inference', ({value}) => {
  const invalid: string = value;
  expect(invalid).toBe('1');
});
vi.spyOn({format: (value: number): string => String(value)}, 'format').mockImplementation((value) => {
  const invalid: string = value;
  return invalid;
});
expect(document.body).toHaveTextContent(7);
expect(document.body).toBeAnInventedMatcher();

const named: MockInstance<(value: number) => string> = vi.spyOn({format: (value: number): string => String(value)}, 'format');
named.mockImplementation((value) => {
  const invalid: string = value;
  return invalid;
});
named.mockReturnValue(7);
named.mockImplementation(() => 7);
