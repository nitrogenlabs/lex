// @vitest-environment jsdom
import {cleanup, render, screen} from '@nlabs/lex/test-react';
import {afterEach, expect as publicExpect, test as publicTest} from '@nlabs/lex/test-vitest';
import {createElement} from 'react';

afterEach(cleanup);

publicTest('registers public DOM matchers on the running framework', () => {
  render(createElement('button', {disabled: true}, 'Save'));
  const button = screen.getByRole('button');
  publicExpect(button).toBeInTheDocument();
  publicExpect(button).toBeDisabled();
  expect(button).toHaveTextContent('Save');
  if(false) {
    // @ts-expect-error upstream matcher rejects an invalid expected text
    publicExpect(button).toHaveTextContent(7);
    // @ts-expect-error upstream matcher rejects unknown matchers
    publicExpect(button).toBeAnInventedMatcher();
  }
  cleanup();
  publicExpect(screen.queryByRole('button')).not.toBeInTheDocument();
});
