// @vitest-environment jsdom
import {createElement} from 'react';

import {expect as publicExpect} from '../test-vitest/index.js';
import {cleanup, render, screen} from './index.js';

afterEach(cleanup);

test('registers real DOM assertions on the public runner and cleans up the rendered tree', () => {
  render(createElement('button', {disabled: true}, 'Save'));
  const button = screen.getByRole('button');
  publicExpect(button).toBeInTheDocument();

  expect(button).toBeDisabled();
  expect(button).toHaveTextContent('Save');

  cleanup();

  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
