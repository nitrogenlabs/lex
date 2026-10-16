import '@nlabs/lex/test-react';
import {expect, test, vi} from '@nlabs/lex/test-vitest';

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
