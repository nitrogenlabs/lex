import '@nlabs/lex/test-vitest/globals';
import {expect, test} from '@nlabs/lex/test-vitest';

test('globals module does not enable runner globals', () => {
  expect(typeof vi).toBe('undefined');
});
