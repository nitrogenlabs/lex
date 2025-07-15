/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {jest} from '@jest/globals';
import {execa} from 'execa';

import {update, UpdateCallback} from './update.js';
import {LexConfig} from '../../LexConfig.js';

jest.mock('execa');
jest.mock('../../LexConfig.js');

describe('update.integration', () => {
  const mockExit = jest.fn() as jest.MockedFunction<UpdateCallback>;
  const mockExeca = execa as jest.MockedFunction<typeof execa>;
  const mockLexConfig = LexConfig as jest.Mocked<typeof LexConfig>;

  beforeEach(() => {
    mockExit.mockClear();
    mockExeca.mockClear();
    mockExeca.mockResolvedValue({} as any);
    mockLexConfig.parseConfig.mockResolvedValue(undefined);
    mockLexConfig.config = {
      packageManager: 'npm'
    } as any;
  });

  it('should use config packageManager when not provided in command', async () => {
    mockLexConfig.config = {
      packageManager: 'yarn'
    } as any;

    await update({}, mockExit);

    expect(mockExeca).toHaveBeenCalledWith('yarn', expect.anything(), expect.any(Object));
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should use command packageManager over config packageManager', async () => {
    mockLexConfig.config = {
      packageManager: 'yarn'
    } as any;

    await update({packageManager: 'npm'}, mockExit);

    expect(mockExeca).toHaveBeenCalledWith('npx', expect.anything(), expect.any(Object));
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should default to npm if no packageManager is specified', async () => {
    mockLexConfig.config = {} as any;

    await update({}, mockExit);

    expect(mockExeca).toHaveBeenCalledWith('npx', expect.anything(), expect.any(Object));
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should return 0 on success', async () => {
    const result = await update({}, mockExit);

    expect(result).toBe(0);
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should return 1 on error', async () => {
    mockExeca.mockRejectedValueOnce(new Error('Failed to update'));

    const result = await update({}, mockExit);

    expect(result).toBe(1);
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});