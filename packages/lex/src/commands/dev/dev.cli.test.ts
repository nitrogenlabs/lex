/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import path from 'path';

import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as file from '../../utils/file.js';
import * as log from '../../utils/log.js';
import {dev, DevOptions} from './dev.js';

// Mock dependencies
jest.mock('execa');
jest.mock('path');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/file.js');
jest.mock('../../utils/log.js');

describe('dev.cli tests', () => {
  let mockCallback: jest.Mock;
  let mockSpinner: {
    start: jest.Mock;
    succeed: jest.Mock;
    fail: jest.Mock;
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock process.env
    process.env = {
      NODE_ENV: 'test'
    };
    
    // Mock URL
    global.URL = jest.fn().mockImplementation(() => ({
      pathname: '/test/path'
    })) as any;
    
    // Mock path
    (path.resolve as jest.Mock).mockImplementation((...args) => args.join('/'));
    
    // Mock spinner
    mockSpinner = {
      start: jest.fn(),
      succeed: jest.fn(),
      fail: jest.fn()
    };
    (app.createSpinner as jest.Mock).mockReturnValue(mockSpinner);
    (app.removeFiles as jest.Mock).mockResolvedValue(undefined);
    
    // Mock file utilities
    (file.relativeNodePath as jest.Mock).mockReturnValue('/node_modules/webpack-cli/bin/cli.js');
    
    // Mock execa
    (execa as unknown as jest.Mock).mockResolvedValue({
      stdout: 'webpack output',
      stderr: ''
    });
    
    // Mock LexConfig
    LexConfig.parseConfig = jest.fn().mockResolvedValue(undefined);
    LexConfig.checkTypescriptConfig = jest.fn();
    LexConfig.config = {
      outputFullPath: './dist',
      useTypescript: true
    };
    
    // Mock callback
    mockCallback = jest.fn();
  });
  
  it('should start the development server with default options', async () => {
    const options: DevOptions = {
      quiet: false
    };
    
    const result = await dev(options, mockCallback);
    
    expect(log.log).toHaveBeenCalledWith('Lex start development server...', 'info', false);
    expect(LexConfig.parseConfig).toHaveBeenCalledWith(options);
    expect(LexConfig.checkTypescriptConfig).toHaveBeenCalled();
    expect(execa).toHaveBeenCalledWith(
      '/node_modules/webpack-cli/bin/cli.js',
      ['--color', '--watch', '--config', '/test/path/../../../webpack.config.js'],
      expect.objectContaining({
        encoding: 'utf8',
        env: {
          LEX_QUIET: false,
          WEBPACK_DEV_OPEN: false,
          NODE_ENV: 'development'
        }
      })
    );
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Development server started.');
    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });
  
  it('should use custom CLI name when provided', async () => {
    const options: DevOptions = {
      cliName: 'CustomCLI',
      quiet: false
    };
    
    await dev(options, mockCallback);
    
    expect(log.log).toHaveBeenCalledWith('CustomCLI start development server...', 'info', false);
  });
  
  it('should use custom webpack config when provided', async () => {
    const options: DevOptions = {
      config: './custom.webpack.config.js',
      quiet: false
    };
    
    await dev(options, mockCallback);
    
    expect(execa).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['--config', './custom.webpack.config.js']),
      expect.any(Object)
    );
  });
  
  it('should enable bundle analyzer when requested', async () => {
    const options: DevOptions = {
      bundleAnalyzer: true,
      quiet: false
    };
    
    await dev(options, mockCallback);
    
    expect(execa).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['--bundleAnalyzer']),
      expect.any(Object)
    );
  });
  
  it('should enable open option when requested', async () => {
    const options: DevOptions = {
      open: true,
      quiet: false
    };
    
    await dev(options, mockCallback);
    
    expect(execa).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      expect.objectContaining({
        env: expect.objectContaining({
          WEBPACK_DEV_OPEN: true
        })
      })
    );
  });
  
  it('should clean output directory when remove option is true', async () => {
    const options: DevOptions = {
      remove: true,
      quiet: false
    };
    
    await dev(options, mockCallback);
    
    expect(mockSpinner.start).toHaveBeenCalledWith('Cleaning output directory...');
    expect(app.removeFiles).toHaveBeenCalledWith('./dist');
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Successfully cleaned output directory!');
  });
  
  it('should not clean output directory when remove option is not provided', async () => {
    const options: DevOptions = {
      quiet: false
    };
    
    await dev(options, mockCallback);
    
    expect(mockSpinner.start).not.toHaveBeenCalledWith('Cleaning output directory...');
    expect(app.removeFiles).not.toHaveBeenCalled();
  });
  
  it('should handle environment variables when provided as valid JSON', async () => {
    const options: DevOptions = {
      variables: '{"API_URL": "https://api.example.com", "DEBUG": true}',
      quiet: false
    };
    
    await dev(options, mockCallback);
    
    expect(process.env).toEqual(expect.objectContaining({
      NODE_ENV: 'development',
      API_URL: 'https://api.example.com',
      DEBUG: true
    }));
  });
  
  it('should handle invalid environment variables JSON', async () => {
    const options: DevOptions = {
      variables: '{invalid-json}',
      quiet: false
    };
    
    const result = await dev(options, mockCallback);
    
    expect(log.log).toHaveBeenCalledWith(
      '\nLex Error: Environment variables option is not a valid JSON object.',
      'error',
      false
    );
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });
  
  it('should handle webpack errors', async () => {
    const options: DevOptions = {
      quiet: false
    };
    
    const errorMessage = 'Webpack compilation failed';
    (execa as unknown as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    const result = await dev(options, mockCallback);
    
    expect(log.log).toHaveBeenCalledWith(`\nLex Error: ${errorMessage}`, 'error', false);
    expect(mockSpinner.fail).toHaveBeenCalledWith('There was an error while running Webpack.');
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });
  
  it('should respect quiet option', async () => {
    const options: DevOptions = {
      quiet: true
    };
    
    await dev(options, mockCallback);
    
    expect(log.log).toHaveBeenCalledWith('Lex start development server...', 'info', true);
    expect(app.createSpinner).toHaveBeenCalledWith(true);
    expect(execa).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      expect.objectContaining({
        env: expect.objectContaining({
          LEX_QUIET: true
        })
      })
    );
  });
}); 