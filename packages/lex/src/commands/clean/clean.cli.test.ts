/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {clean, CleanOptions} from './clean.js';
import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as log from '../../utils/log.js';

// Mock dependencies
jest.mock('../../utils/app.js');
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js');

describe('clean.cli tests', () => {
  let mockSpinner: any;
  let mockCallback: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock spinner
    mockSpinner = {
      start: jest.fn(),
      succeed: jest.fn(),
      fail: jest.fn()
    };
    (app.createSpinner as jest.Mock).mockReturnValue(mockSpinner);

    // Mock LexConfig
    (LexConfig.parseConfig as jest.Mock).mockResolvedValue({});

    // Mock app utilities
    (app.removeModules as jest.Mock).mockResolvedValue(undefined);
    (app.removeFiles as jest.Mock).mockResolvedValue(undefined);

    // Mock callback
    mockCallback = jest.fn();
  });

  it('should clean files with default options', async () => {
    const options: CleanOptions = {
      quiet: false
    };

    const result = await clean(options, mockCallback);

    expect(log.log).toHaveBeenCalledWith('Lex cleaning directory...', 'info', false);
    expect(LexConfig.parseConfig).toHaveBeenCalledWith(options);
    expect(mockSpinner.start).toHaveBeenCalledWith('Cleaning files...');
    expect(app.removeModules).toHaveBeenCalled();
    expect(app.removeFiles).toHaveBeenCalledWith('./coverage', true);
    expect(app.removeFiles).toHaveBeenCalledWith('./npm-debug.log', true);
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Successfully cleaned!');
    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should clean snapshots when snapshots option is true', async () => {
    const options: CleanOptions = {
      quiet: false,
      snapshots: true
    };

    await clean(options, mockCallback);

    expect(app.removeFiles).toHaveBeenCalledWith('./**/__snapshots__', true);
  });

  it('should not clean snapshots when snapshots option is false', async () => {
    const options: CleanOptions = {
      quiet: false,
      snapshots: false
    };

    await clean(options, mockCallback);

    expect(app.removeFiles).not.toHaveBeenCalledWith('./**/__snapshots__', true);
  });

  it('should use custom CLI name when provided', async () => {
    const options: CleanOptions = {
      cliName: 'CustomCLI',
      quiet: false
    };

    await clean(options, mockCallback);

    expect(log.log).toHaveBeenCalledWith('CustomCLI cleaning directory...', 'info', false);
  });

  it('should handle errors during cleaning', async () => {
    const options: CleanOptions = {
      quiet: false
    };

    const errorMessage = 'Failed to remove files';
    (app.removeModules as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    const result = await clean(options, mockCallback);

    expect(mockSpinner.fail).toHaveBeenCalledWith('Failed to clean project.');
    expect(log.log).toHaveBeenCalledWith(`\nLex Error: ${errorMessage}`, 'error', false);
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  it('should respect quiet option', async () => {
    const options: CleanOptions = {
      quiet: true
    };

    await clean(options, mockCallback);

    expect(app.createSpinner).toHaveBeenCalledWith(true);
    expect(log.log).toHaveBeenCalledWith('Lex cleaning directory...', 'info', true);
  });
});