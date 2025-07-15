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

describe('copy.cli tests', () => {
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

  it('should copy a file with default options', async () => {
    const from = './source.txt';
    const to = './destination.txt';
    const options: CopyOptions = {
      quiet: false
    };

    const result = await copy(from, to, options, mockCallback);

    expect(log.log).toHaveBeenCalledWith('Lex copying "./destination.txt"...', 'info', false);
    expect(fs.existsSync).toHaveBeenCalledWith(from);
    expect(fs.lstatSync).toHaveBeenCalledWith(from);
    expect(app.copyFileSync).toHaveBeenCalledWith(from, to);
    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should copy a directory with default options', async () => {
    const from = './source-dir';
    const to = './destination-dir';
    const options: CopyOptions = {
      quiet: false
    };

    // Mock directory check
    (fs.lstatSync as jest.Mock).mockReturnValue({
      isDirectory: jest.fn().mockReturnValue(true)
    });

    const result = await copy(from, to, options, mockCallback);

    expect(log.log).toHaveBeenCalledWith('Lex copying "./destination-dir"...', 'info', false);
    expect(fs.existsSync).toHaveBeenCalledWith(from);
    expect(fs.lstatSync).toHaveBeenCalledWith(from);
    expect(app.copyFolderRecursiveSync).toHaveBeenCalledWith(from, to);
    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should handle source path not found error', async () => {
    const from = './nonexistent.txt';
    const to = './destination.txt';
    const options: CopyOptions = {
      quiet: false
    };

    // Mock path not found
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    const result = await copy(from, to, options, mockCallback);

    expect(log.log).toHaveBeenCalledWith('\nLex Error: Path not found, "./nonexistent.txt"...', 'error', false);
    expect(app.copyFileSync).not.toHaveBeenCalled();
    expect(app.copyFolderRecursiveSync).not.toHaveBeenCalled();
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  it('should handle file copy error', async () => {
    const from = './source.txt';
    const to = './destination.txt';
    const options: CopyOptions = {
      quiet: false
    };

    const errorMessage = 'Permission denied';
    (app.copyFileSync as jest.Mock).mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const result = await copy(from, to, options, mockCallback);

    expect(log.log).toHaveBeenCalledWith(`\nLex Error: Cannot copy "./source.txt" ${errorMessage}`, 'error', false);
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  it('should handle directory copy error', async () => {
    const from = './source-dir';
    const to = './destination-dir';
    const options: CopyOptions = {
      quiet: false
    };

    // Mock directory check
    (fs.lstatSync as jest.Mock).mockReturnValue({
      isDirectory: jest.fn().mockReturnValue(true)
    });

    const errorMessage = 'Permission denied';
    (app.copyFolderRecursiveSync as jest.Mock).mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const result = await copy(from, to, options, mockCallback);

    expect(log.log).toHaveBeenCalledWith(`\nLex Error: Cannot copy "./source-dir". ${errorMessage}`, 'error', false);
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  it('should use custom CLI name when provided', async () => {
    const from = './source.txt';
    const to = './destination.txt';
    const options: CopyOptions = {
      cliName: 'CustomCLI',
      quiet: false
    };

    await copy(from, to, options, mockCallback);

    expect(log.log).toHaveBeenCalledWith('CustomCLI copying "./destination.txt"...', 'info', false);
  });

  it('should respect quiet option', async () => {
    const from = './source.txt';
    const to = './destination.txt';
    const options: CopyOptions = {
      quiet: true
    };

    await copy(from, to, options, mockCallback);

    expect(log.log).toHaveBeenCalledWith('Lex copying "./destination.txt"...', 'info', true);
  });
});