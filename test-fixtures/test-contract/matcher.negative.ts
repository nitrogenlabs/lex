// @vitest-environment jsdom
import {expect, test} from '@nlabs/lex/test-vitest';

// No test-react setup: proves the positive requires Lex matcher registration.
test('unregistered matcher control fails', () => {
  expect(document.createElement('button')).toBeInTheDocument();
});
