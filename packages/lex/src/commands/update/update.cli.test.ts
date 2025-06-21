/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {jest} from '@jest/globals';
import {execa} from 'execa';

import {update, UpdateCallback} from './update.js';

jest.mock('execa');

describe('update.cli', () => {
  const mockExit = jest.fn() as jest.MockedFunction<UpdateCallback>;
  const mockExeca = execa as jest.MockedFunction<typeof execa>;

  beforeEach(() => {
    mockExit.mockClear();
    mockExeca.mockClear();
    mockExeca.mockResolvedValue({} as any);
  });

  it('should update packages with npm', async () => {
    await update({packageManager: 'npm'}, mockExit);

    expect(mockExeca).toHaveBeenCalledWith('npx', expect.arrayContaining(['--packageManager', 'npm']), expect.any(Object));
    expect(mockExeca).toHaveBeenCalledWith('npm', ['i', '--force'], expect.any(Object));
    expect(mockExeca).toHaveBeenCalledWith('npm', ['audit', 'fix'], expect.any(Object));
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should update packages with yarn', async () => {
    await update({packageManager: 'yarn'}, mockExit);

    expect(mockExeca).toHaveBeenCalledWith('yarn', ['upgrade', '--latest'], expect.any(Object));
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should handle interactive mode', async () => {
    await update({packageManager: 'npm', interactive: true}, mockExit);

    expect(mockExeca).toHaveBeenCalledWith('npx', expect.arrayContaining(['--interactive']), expect.any(Object));
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should handle registry option', async () => {
    await update({packageManager: 'npm', registry: 'https://registry.npmjs.org'}, mockExit);

    expect(mockExeca).toHaveBeenCalledWith('npx', expect.arrayContaining(['--registry', 'https://registry.npmjs.org']), expect.any(Object));
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should handle errors', async () => {
    const errorMessage = 'Failed to update packages';
    mockExeca.mockRejectedValueOnce(new Error(errorMessage));

    await update({}, mockExit);

    expect(mockExit).toHaveBeenCalledWith(1);
  });
});