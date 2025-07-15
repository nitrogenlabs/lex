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

describe('copy.options tests', () => {
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

  it('should respect quiet option when true', async () => {
    const from = './source.txt';
    const to = './destination.txt';
    const options: CopyOptions = {
      quiet: true
    };

    await copy(from, to, options, mockCallback);

    // Should log with quiet=true
    expect(log.log).toHaveBeenCalledWith('Lex copying "./destination.txt"...', 'info', true);

    // Should log errors with quiet=true
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    await copy(from, to, options, mockCallback);

    expect(log.log).toHaveBeenCalledWith(
      expect.stringContaining('Error: Path not found'),
      'error',
      true
    );
  });

  it('should respect quiet option when false', async () => {
    const from = './source.txt';
    const to = './destination.txt';
    const options: CopyOptions = {
      quiet: false
    };

    await copy(from, to, options, mockCallback);

    // Should log with quiet=false
    expect(log.log).toHaveBeenCalledWith('Lex copying "./destination.txt"...', 'info', false);

    // Should log errors with quiet=false
    (app.copyFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Test error');
    });

    await copy(from, to, options, mockCallback);

    expect(log.log).toHaveBeenCalledWith(
      expect.stringContaining('Error: Cannot copy'),
      'error',
      false
    );
  });

  it('should use custom CLI name when provided', async () => {
    const from = './source.txt';
    const to = './destination.txt';
    const customName = 'CustomCLI';
    const options: CopyOptions = {
      cliName: customName,
      quiet: false
    };

    await copy(from, to, options, mockCallback);

    // Should use custom name in logs
    expect(log.log).toHaveBeenCalledWith(`${customName} copying "./destination.txt"...`, 'info', false);

    // Should use custom name in error messages if there was an error
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    await copy(from, to, options, mockCallback);

    expect(log.log).toHaveBeenCalledWith(
      `\n${customName} Error: Path not found, "./source.txt"...`,
      'error',
      false
    );
  });

  it('should use default CLI name when not provided', async () => {
    const from = './source.txt';
    const to = './destination.txt';
    const options: CopyOptions = {
      quiet: false
    };

    await copy(from, to, options, mockCallback);

    // Should use default name in logs
    expect(log.log).toHaveBeenCalledWith('Lex copying "./destination.txt"...', 'info', false);

    // Should use default name in error messages if there was an error
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    await copy(from, to, options, mockCallback);

    expect(log.log).toHaveBeenCalledWith(
      '\nLex Error: Path not found, "./source.txt"...',
      'error',
      false
    );
  });

  it('should handle empty options object', async () => {
    const from = './source.txt';
    const to = './destination.txt';
    const options: CopyOptions = {};

    await copy(from, to, options, mockCallback);

    // Should use default values
    expect(log.log).toHaveBeenCalledWith('Lex copying "./destination.txt"...', 'info', undefined);
  });

  it('should handle both options being set', async () => {
    const from = './source.txt';
    const to = './destination.txt';
    const customName = 'CustomCLI';
    const options: CopyOptions = {
      cliName: customName,
      quiet: true
    };

    await copy(from, to, options, mockCallback);

    // Should use both options
    expect(log.log).toHaveBeenCalledWith(`${customName} copying "./destination.txt"...`, 'info', true);
  });
});