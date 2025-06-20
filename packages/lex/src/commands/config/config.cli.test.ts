/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import fs from 'fs';
import path from 'path';
import startCase from 'lodash/startCase.js';

import * as app from '../../utils/app.js';
import * as log from '../../utils/log.js';
import { LexConfig } from '../../LexConfig.js';
import { config, ConfigOptions } from './config.js';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('lodash/startCase.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js');

// Mock dynamic imports
jest.mock('../../../jest.config.lex.js', () => ({
  default: { preset: 'ts-jest', testEnvironment: 'node' }
}), { virtual: true });

jest.mock('../../../webpack.config.js', () => ({
  default: { mode: 'development', entry: './src/index.js' }
}), { virtual: true });

describe('config.cli tests', () => {
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
    LexConfig.config = { appName: 'test-app', version: '1.0.0' } as any;
    
    // Mock fs
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    
    // Mock path
    (path.relative as jest.Mock).mockReturnValue('relative/path/to/config.json');
    
    // Mock startCase
    (startCase as unknown as jest.Mock).mockImplementation((str) => str.toUpperCase());
    
    // Mock callback
    mockCallback = jest.fn();
  });
  
  it('should generate app configuration', async () => {
    const type = 'app';
    const options: ConfigOptions = {
      quiet: false
    };
    
    const result = await config(type, options, mockCallback);
    
    expect(log.log).toHaveBeenCalledWith('Lex generating configuration for APP...', 'info', false);
    expect(LexConfig.parseConfig).toHaveBeenCalledWith(options);
    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });
  
  it('should generate jest configuration', async () => {
    const type = 'jest';
    const options: ConfigOptions = {
      quiet: false
    };
    
    const result = await config(type, options, mockCallback);
    
    expect(log.log).toHaveBeenCalledWith('Lex generating configuration for JEST...', 'info', false);
    expect(LexConfig.parseConfig).toHaveBeenCalledWith(options);
    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });
  
  it('should generate webpack configuration', async () => {
    const type = 'webpack';
    const options: ConfigOptions = {
      quiet: false
    };
    
    const result = await config(type, options, mockCallback);
    
    expect(log.log).toHaveBeenCalledWith('Lex generating configuration for WEBPACK...', 'info', false);
    expect(LexConfig.parseConfig).toHaveBeenCalledWith(options);
    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });
  
  it('should reject invalid configuration types', async () => {
    const type = 'invalid';
    const options: ConfigOptions = {
      quiet: false
    };
    
    const result = await config(type, options, mockCallback);
    
    expect(log.log).toHaveBeenCalledWith(
      '\nLex Error: Option for invalid not found. Configurations only available for app, jest, and webpack.',
      'error',
      false
    );
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });
  
  it('should use custom CLI name when provided', async () => {
    const type = 'app';
    const options: ConfigOptions = {
      cliName: 'CustomCLI',
      quiet: false
    };
    
    await config(type, options, mockCallback);
    
    expect(log.log).toHaveBeenCalledWith('CustomCLI generating configuration for APP...', 'info', false);
  });
  
  it('should save JSON output to file when json option is provided', async () => {
    const type = 'app';
    const jsonPath = './config.json';
    const options: ConfigOptions = {
      json: jsonPath,
      quiet: false
    };
    
    await config(type, options, mockCallback);
    
    expect(mockSpinner.start).toHaveBeenCalledWith('Creating JSON output...');
    expect(fs.writeFileSync).toHaveBeenCalledWith(jsonPath, expect.any(String));
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Successfully saved JSON output to relative/path/to/config.json');
  });
}); 