/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import fs from 'fs';

import {copy, CopyOptions} from './copy.js';
import * as app from '../../utils/app.js';
import * as log from '../../utils/log.js';

// Mock dependencies
jest.mock('fs');
jest.mock('../../utils/app.js');
jest.mock('../../utils/log.js');

describe('copy integration tests', () => {
  let mockCallback: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fs
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.lstatSync as jest.Mock).mockReturnValue({
      isDirectory: jest.fn().mockReturnValue(false)
    });

    // Mock app utilities
    (app.copyFileSync as jest.Mock).mockImplementation(() => {});
    (app.copyFolderRecursiveSync as jest.Mock).mockImplementation(() => {});

    // Mock callback
    mockCallback = jest.fn();
  });

  it('should integrate with fs to check if source exists', async () => {
    const from = './source.txt';
    const to = './destination.txt';
    const options: CopyOptions = {
      quiet: false
    };

    await copy(from, to, options, mockCallback);

    // Verify fs.existsSync was called with the correct path
    expect(fs.existsSync).toHaveBeenCalledWith(from);
  });

  it('should integrate with fs to check if source is a directory', async () => {
    const from = './source.txt';
    const to = './destination.txt';
    const options: CopyOptions = {
      quiet: false
    };

    await copy(from, to, options, mockCallback);

    // Verify fs.lstatSync was called with the correct path
    expect(fs.lstatSync).toHaveBeenCalledWith(from);
  });

  it('should integrate with app.copyFileSync for file copying', async () => {
    const from = './source.txt';
    const to = './destination.txt';
    const options: CopyOptions = {
      quiet: false
    };

    await copy(from, to, options, mockCallback);

    // Verify app.copyFileSync was called with the correct paths
    expect(app.copyFileSync).toHaveBeenCalledWith(from, to);
    expect(app.copyFolderRecursiveSync).not.toHaveBeenCalled();
  });

  it('should integrate with app.copyFolderRecursiveSync for directory copying', async () => {
    const from = './source-dir';
    const to = './destination-dir';
    const options: CopyOptions = {
      quiet: false
    };

    // Mock directory check
    (fs.lstatSync as jest.Mock).mockReturnValue({
      isDirectory: jest.fn().mockReturnValue(true)
    });

    await copy(from, to, options, mockCallback);

    // Verify app.copyFolderRecursiveSync was called with the correct paths
    expect(app.copyFolderRecursiveSync).toHaveBeenCalledWith(from, to);
    expect(app.copyFileSync).not.toHaveBeenCalled();
  });

  it('should handle non-existent source path', async () => {
    const from = './nonexistent.txt';
    const to = './destination.txt';
    const options: CopyOptions = {
      quiet: false
    };

    // Mock path not found
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    const result = await copy(from, to, options, mockCallback);

    // Verify error handling and no copy operations were performed
    expect(log.log).toHaveBeenCalledWith(expect.stringContaining('Error: Path not found'), 'error', false);
    expect(app.copyFileSync).not.toHaveBeenCalled();
    expect(app.copyFolderRecursiveSync).not.toHaveBeenCalled();
    expect(result).toBe(1);
  });

  it('should handle file copy errors', async () => {
    const from = './source.txt';
    const to = './destination.txt';
    const options: CopyOptions = {
      quiet: false
    };

    // Mock file copy error
    const errorMessage = 'Permission denied';
    (app.copyFileSync as jest.Mock).mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const result = await copy(from, to, options, mockCallback);

    // Verify error handling
    expect(log.log).toHaveBeenCalledWith(expect.stringContaining('Error: Cannot copy'), 'error', false);
    expect(result).toBe(1);
  });

  it('should handle directory copy errors', async () => {
    const from = './source-dir';
    const to = './destination-dir';
    const options: CopyOptions = {
      quiet: false
    };

    // Mock directory check
    (fs.lstatSync as jest.Mock).mockReturnValue({
      isDirectory: jest.fn().mockReturnValue(true)
    });

    // Mock directory copy error
    const errorMessage = 'Permission denied';
    (app.copyFolderRecursiveSync as jest.Mock).mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const result = await copy(from, to, options, mockCallback);

    // Verify error handling
    expect(log.log).toHaveBeenCalledWith(expect.stringContaining('Error: Cannot copy'), 'error', false);
    expect(result).toBe(1);
  });

  it('should properly integrate logging with copy operations', async () => {
    const from = './source.txt';
    const to = './destination.txt';
    const options: CopyOptions = {
      quiet: false
    };

    await copy(from, to, options, mockCallback);

    // Verify logging was called before copy operation
    const logCallOrder = (log.log as jest.Mock).mock.invocationCallOrder[0];
    const copyCallOrder = (app.copyFileSync as jest.Mock).mock.invocationCallOrder[0];

    expect(logCallOrder).toBeLessThan(copyCallOrder);
  });
});