/**
 * Copyright (c) 2025-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import * as matchers from '@testing-library/jest-dom/matchers';
import 'vitest';

import {expect} from '../test-vitest/index.js';

import type {TestingLibraryMatchers} from '@testing-library/jest-dom/matchers';

// Resolve the augmented runner from Lex, not from jest-dom's optional peer location.
declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Required for upstream declaration merging.
  interface Assertion<T = any> extends TestingLibraryMatchers<any, T> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Required for upstream declaration merging.
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<any, any> {}
}

// The upstream export= declaration adds a synthetic default; its ESM entry only exports matchers.
expect.extend(matchers as Omit<typeof matchers, 'default'>);

export {
  render,
  screen,
  fireEvent,
  waitFor,
  waitForElementToBeRemoved,
  within,
  getByRole,
  getByLabelText,
  getByPlaceholderText,
  getByText,
  getByTestId,
  getAllByRole,
  getAllByLabelText,
  getAllByPlaceholderText,
  getAllByText,
  getAllByTestId,
  queryByRole,
  queryByLabelText,
  queryByPlaceholderText,
  queryByText,
  queryByTestId,
  queryAllByRole,
  queryAllByLabelText,
  queryAllByPlaceholderText,
  queryAllByText,
  queryAllByTestId,
  findByRole,
  findByLabelText,
  findByPlaceholderText,
  findByText,
  findByTestId,
  findAllByRole,
  findAllByLabelText,
  findAllByPlaceholderText,
  findAllByText,
  findAllByTestId,
  renderHook,
  act,
  cleanup
} from '@testing-library/react';
