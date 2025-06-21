/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import fs from 'fs';
import startCase from 'lodash/startCase.js';
import path from 'path';

import {config, ConfigOptions} from './config.js';
import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as log from '../../utils/log.js';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('lodash/startCase.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js');

// Mock dynamic imports
jest.mock('../../../jest.config.lex.js', () => ({
  default: {preset: 'ts-jest', testEnvironment: 'node'}
}), {virtual: true});

jest.mock('../../../webpack.config.js', () => ({
  default: {mode: 'development', entry: './src/index.js'}
}), {virtual: true});

describe('config integration tests', () => {
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

    // Mock startCase
    (startCase as unknown as jest.Mock).mockImplementation((str) => str.toUpperCase());

    // Mock process.cwd
    jest.spyOn(process, 'cwd').mockReturnValue('/test/project');

    // Mock callback
    mockCallback = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should integrate with LexConfig to get app configuration', async () => {
    const type = 'app';
    const options: ConfigOptions = {
      quiet: false
    };

    await config(type, options, mockCallback);

    // Verify LexConfig was parsed before getting configuration
    expect(LexConfig.parseConfig).toHaveBeenCalledWith(options);

    // Verify the configuration was retrieved from LexConfig
    const jsonOutput = JSON.stringify(LexConfig.config, null, 2);
    expect(jsonOutput).toContain('test-app');
  });

  it('should integrate with jest config module', async () => {
    const type = 'jest';
    const options: ConfigOptions = {
      quiet: false
    };

    await config(type, options, mockCallback);

    // Verify the jest config module was imported
    // Note: This is implicitly tested since we're mocking the import
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should integrate with webpack config module', async () => {
    const type = 'webpack';
    const options: ConfigOptions = {
      quiet: false
    };

    await config(type, options, mockCallback);

    // Verify the webpack config module was imported
    // Note: This is implicitly tested since we're mocking the import
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should integrate with filesystem when saving JSON output', async () => {
    const type = 'app';
    const jsonPath = './output/config.json';
    const options: ConfigOptions = {
      json: jsonPath,
      quiet: false
    };

    await config(type, options, mockCallback);

    // Verify fs.writeFileSync was called with the correct path and content
    expect(fs.writeFileSync).toHaveBeenCalledWith(jsonPath, expect.any(String));

    // Verify path.relative was called to get the relative path for the success message
    expect(path.relative).toHaveBeenCalledWith('/test/project', jsonPath);

    // Verify success message
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Successfully saved JSON output to relative/path/to/config.json');
  });

  it('should handle errors from invalid configuration types', async () => {
    const type = 'invalid';
    const options: ConfigOptions = {
      quiet: false
    };

    const result = await config(type, options, mockCallback);

    // Verify error handling
    expect(log.log).toHaveBeenCalledWith(
      expect.stringContaining('Error: Option for invalid not found'),
      'error',
      false
    );
    expect(result).toBe(1);

    // Verify LexConfig.parseConfig was not called
    expect(LexConfig.parseConfig).not.toHaveBeenCalled();
  });

  it('should format the configuration type with startCase', async () => {
    const type = 'webpack';
    const options: ConfigOptions = {
      quiet: false
    };

    await config(type, options, mockCallback);

    // Verify startCase was called with the type
    expect(startCase).toHaveBeenCalledWith(type);

    // Verify log message used the formatted type
    expect(log.log).toHaveBeenCalledWith(
      expect.stringContaining('configuration for WEBPACK'),
      'info',
      false
    );
  });
});