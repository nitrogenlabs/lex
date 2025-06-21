/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';

import {dev, DevOptions} from './dev.js';
import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as log from '../../utils/log.js';

// Mock dependencies
jest.mock('execa');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/log.js');

describe('dev.options tests', () => {
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

    // Mock spinner
    mockSpinner = {
      start: jest.fn(),
      succeed: jest.fn(),
      fail: jest.fn()
    };
    (app.createSpinner as jest.Mock).mockReturnValue(mockSpinner);

    // Mock execa
    (execa as unknown as jest.Mock).mockResolvedValue({
      stdout: 'webpack output',
      stderr: ''
    });

    // Mock LexConfig
    LexConfig.parseConfig = jest.fn().mockResolvedValue(undefined);
    LexConfig.config = {
      outputFullPath: './dist',
      useTypescript: true
    };

    // Mock callback
    mockCallback = jest.fn();
  });

  it('should respect bundleAnalyzer option when true', async () => {
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

  it('should not include bundleAnalyzer option when false', async () => {
    const options: DevOptions = {
      bundleAnalyzer: false,
      quiet: false
    };

    await dev(options, mockCallback);

    const webpackOptions = (execa as unknown as jest.Mock).mock.calls[0][1];
    expect(webpackOptions).not.toContain('--bundleAnalyzer');
  });

  it('should respect cliName option when provided', async () => {
    const customName = 'CustomCLI';
    const options: DevOptions = {
      cliName: customName,
      quiet: false
    };

    await dev(options, mockCallback);

    expect(log.log).toHaveBeenCalledWith(`${customName} start development server...`, 'info', false);

    // Mock error to test error message with custom CLI name
    (execa as unknown as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

    await dev(options, mockCallback);

    expect(log.log).toHaveBeenCalledWith(`\n${customName} Error: Test error`, 'error', false);
  });

  it('should use default CLI name when not provided', async () => {
    const options: DevOptions = {
      quiet: false
    };

    await dev(options, mockCallback);

    expect(log.log).toHaveBeenCalledWith('Lex start development server...', 'info', false);
  });

  it('should respect config option when provided', async () => {
    const customConfig = './custom.webpack.config.js';
    const options: DevOptions = {
      config: customConfig,
      quiet: false
    };

    await dev(options, mockCallback);

    expect(execa).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['--config', customConfig]),
      expect.any(Object)
    );
  });

  it('should use default webpack config when config option not provided', async () => {
    const options: DevOptions = {
      quiet: false
    };

    await dev(options, mockCallback);

    // Should include --config flag followed by a path
    const webpackOptions = (execa as unknown as jest.Mock).mock.calls[0][1];
    const configIndex = webpackOptions.indexOf('--config');
    expect(configIndex).not.toBe(-1);
    expect(webpackOptions[configIndex + 1]).toContain('webpack.config.js');
  });

  it('should respect open option when true', async () => {
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

  it('should set open option to false by default', async () => {
    const options: DevOptions = {
      quiet: false
    };

    await dev(options, mockCallback);

    expect(execa).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      expect.objectContaining({
        env: expect.objectContaining({
          WEBPACK_DEV_OPEN: false
        })
      })
    );
  });

  it('should respect quiet option when true', async () => {
    const options: DevOptions = {
      quiet: true
    };

    await dev(options, mockCallback);

    expect(log.log).toHaveBeenCalledWith(expect.any(String), expect.any(String), true);
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

  it('should respect quiet option when false', async () => {
    const options: DevOptions = {
      quiet: false
    };

    await dev(options, mockCallback);

    expect(log.log).toHaveBeenCalledWith(expect.any(String), expect.any(String), false);
    expect(app.createSpinner).toHaveBeenCalledWith(false);
    expect(execa).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      expect.objectContaining({
        env: expect.objectContaining({
          LEX_QUIET: false
        })
      })
    );
  });

  it('should respect remove option when true', async () => {
    const options: DevOptions = {
      remove: true,
      quiet: false
    };

    await dev(options, mockCallback);

    expect(app.removeFiles).toHaveBeenCalledWith('./dist');
    expect(mockSpinner.start).toHaveBeenCalledWith('Cleaning output directory...');
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Successfully cleaned output directory!');
  });

  it('should not clean output directory when remove option is false', async () => {
    const options: DevOptions = {
      remove: false,
      quiet: false
    };

    await dev(options, mockCallback);

    expect(app.removeFiles).not.toHaveBeenCalled();
    expect(mockSpinner.start).not.toHaveBeenCalledWith('Cleaning output directory...');
  });

  it('should respect variables option when provided as valid JSON', async () => {
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

  it('should handle invalid variables JSON', async () => {
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
    expect(execa).not.toHaveBeenCalled();
  });

  it('should handle empty options object', async () => {
    const options: DevOptions = {};

    await dev(options, mockCallback);

    // Should use default values
    expect(log.log).toHaveBeenCalledWith('Lex start development server...', 'info', undefined);
  });
});