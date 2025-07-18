/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import '@testing-library/jest-dom';

// Re-export React testing utilities without any Lex dependencies
// Export React for convenience
import * as react from 'react';

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
export {react};