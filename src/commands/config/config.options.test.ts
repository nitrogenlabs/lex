/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import fs from 'fs';
import path from 'path';

import {config, ConfigOptions} from './config.js';
import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as log from '../../utils/log.js';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('lodash/startCase.js', () => jest.fn((str) => str.toUpperCase()));
jest.mock('../../utils/app.js');
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js');

describe('config.options tests', () => {
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
    LexConfig.config = {appName: 'test-app', version: '1.0.0'} as any;

    // Mock fs
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

    // Mock path
    (path.relative as jest.Mock).mockReturnValue('relative/path/to/config.json');

    // Mock callback
    mockCallback = jest.fn();
  });

  it('should respect quiet option when true', async () => {
    const type = 'app';
    const options: ConfigOptions = {
      quiet: true
    };

    await config(type, options, mockCallback);

    // Should log with quiet=true
    expect(log.log).toHaveBeenCalledWith(expect.any(String), 'info', true);

    // Should create spinner with quiet=true
    expect(app.createSpinner).toHaveBeenCalledWith(true);
  });

  it('should respect quiet option when false', async () => {
    const type = 'app';
    const options: ConfigOptions = {
      quiet: false
    };

    await config(type, options, mockCallback);

    // Should log with quiet=false
    expect(log.log).toHaveBeenCalledWith(expect.any(String), 'info', false);

    // Should create spinner with quiet=false if json option is provided
    const optionsWithJson: ConfigOptions = {
      quiet: false,
      json: './config.json'
    };
    await config(type, optionsWithJson, mockCallback);
    expect(app.createSpinner).toHaveBeenCalledWith(false);
  });

  it('should respect json option when provided', async () => {
    const type = 'app';
    const jsonPath = './config.json';
    const options: ConfigOptions = {
      json: jsonPath,
      quiet: false
    };

    await config(type, options, mockCallback);

    // Should create spinner
    expect(app.createSpinner).toHaveBeenCalled();

    // Should write to file
    expect(fs.writeFileSync).toHaveBeenCalledWith(jsonPath, expect.any(String));

    // Should show success message
    expect(mockSpinner.succeed).toHaveBeenCalledWith(expect.stringContaining('Successfully saved JSON output'));
  });

  it('should not create spinner or write file when json option is not provided', async () => {
    const type = 'app';
    const options: ConfigOptions = {
      quiet: false
    };

    await config(type, options, mockCallback);

    // Should not create spinner
    expect(app.createSpinner).not.toHaveBeenCalled();

    // Should not write to file
    expect(fs.writeFileSync).not.toHaveBeenCalled();

    // Should not show success message
    expect(mockSpinner.succeed).not.toHaveBeenCalled();
  });

  it('should use custom CLI name when provided', async () => {
    const type = 'app';
    const customName = 'CustomCLI';
    const options: ConfigOptions = {
      cliName: customName,
      quiet: false
    };

    await config(type, options, mockCallback);

    // Should use custom name in logs
    expect(log.log).toHaveBeenCalledWith(`${customName} generating configuration for APP...`, 'info', false);

    // Should use custom name in error messages if there was an error
    await config('invalid', options, mockCallback);
    expect(log.log).toHaveBeenCalledWith(expect.stringContaining(`${customName} Error:`), 'error', false);
  });

  it('should use default CLI name when not provided', async () => {
    const type = 'app';
    const options: ConfigOptions = {
      quiet: false
    };

    await config(type, options, mockCallback);

    // Should use default name in logs
    expect(log.log).toHaveBeenCalledWith('Lex generating configuration for APP...', 'info', false);
  });

  it('should pass options to LexConfig.parseConfig', async () => {
    const type = 'app';
    const options: ConfigOptions = {
      cliName: 'TestCLI',
      quiet: true,
      json: './config.json'
    };

    await config(type, options, mockCallback);

    // Should pass all options to parseConfig
    expect(LexConfig.parseConfig).toHaveBeenCalledWith(options);
  });
});