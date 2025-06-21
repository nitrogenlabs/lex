/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import path from 'path';

import {dev, DevOptions} from './dev.js';
import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as file from '../../utils/file.js';
import * as log from '../../utils/log.js';

// Mock dependencies
jest.mock('execa');
jest.mock('path');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/file.js');
jest.mock('../../utils/log.js');

describe('dev integration tests', () => {
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

  it('should integrate with LexConfig to parse configuration', async () => {
    const options: DevOptions = {
      quiet: false
    };

    await dev(options, mockCallback);

    expect(LexConfig.parseConfig).toHaveBeenCalledWith(options);
  });

  it('should integrate with LexConfig to check TypeScript configuration when useTypescript is true', async () => {
    const options: DevOptions = {
      quiet: false
    };

    LexConfig.config = {
      ...LexConfig.config,
      useTypescript: true
    };

    await dev(options, mockCallback);

    expect(LexConfig.checkTypescriptConfig).toHaveBeenCalled();
  });

  it('should not check TypeScript configuration when useTypescript is false', async () => {
    const options: DevOptions = {
      quiet: false
    };

    LexConfig.config = {
      ...LexConfig.config,
      useTypescript: false
    };

    await dev(options, mockCallback);

    expect(LexConfig.checkTypescriptConfig).not.toHaveBeenCalled();
  });

  it('should integrate with app.removeFiles when remove option is true', async () => {
    const options: DevOptions = {
      remove: true,
      quiet: false
    };

    await dev(options, mockCallback);

    expect(app.removeFiles).toHaveBeenCalledWith('./dist');
  });

  it('should integrate with file.relativeNodePath to find webpack-cli', async () => {
    const options: DevOptions = {
      quiet: false
    };

    await dev(options, mockCallback);

    expect(file.relativeNodePath).toHaveBeenCalledWith('webpack-cli/bin/cli.js', expect.any(String));
  });

  it('should integrate with execa to run webpack', async () => {
    const options: DevOptions = {
      quiet: false
    };

    await dev(options, mockCallback);

    expect(execa).toHaveBeenCalledWith(
      '/node_modules/webpack-cli/bin/cli.js',
      expect.arrayContaining(['--color', '--watch', '--config']),
      expect.any(Object)
    );
  });

  it('should integrate with app.createSpinner for spinner UI', async () => {
    const options: DevOptions = {
      quiet: false
    };

    await dev(options, mockCallback);

    expect(app.createSpinner).toHaveBeenCalledWith(false);
  });

  it('should integrate with log for output messages', async () => {
    const options: DevOptions = {
      quiet: false
    };

    await dev(options, mockCallback);

    expect(log.log).toHaveBeenCalledWith('Lex start development server...', 'info', false);
  });

  it('should set environment variables correctly', async () => {
    const options: DevOptions = {
      variables: '{"API_URL": "https://api.example.com"}',
      quiet: false
    };

    const originalEnv = {...process.env};

    await dev(options, mockCallback);

    expect(process.env).toEqual({
      ...originalEnv,
      NODE_ENV: 'development',
      API_URL: 'https://api.example.com'
    });
  });

  it('should properly order operations', async () => {
    const options: DevOptions = {
      remove: true,
      quiet: false
    };

    await dev(options, mockCallback);

    // Verify order of operations
    const logCallOrder = (log.log as jest.Mock).mock.invocationCallOrder[0];
    const parseConfigCallOrder = (LexConfig.parseConfig as jest.Mock).mock.invocationCallOrder[0];
    const removeFilesCallOrder = (app.removeFiles as jest.Mock).mock.invocationCallOrder[0];
    const execaCallOrder = (execa as unknown as jest.Mock).mock.invocationCallOrder[0];

    // Log should come first, then parse config, then remove files, then run webpack
    expect(logCallOrder).toBeLessThan(parseConfigCallOrder);
    expect(parseConfigCallOrder).toBeLessThan(removeFilesCallOrder);
    expect(removeFilesCallOrder).toBeLessThan(execaCallOrder);
  });

  it('should handle errors from webpack and call the callback with error code', async () => {
    const options: DevOptions = {
      quiet: false
    };

    (execa as unknown as jest.Mock).mockRejectedValue(new Error('Webpack error'));

    const result = await dev(options, mockCallback);

    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
    expect(mockSpinner.fail).toHaveBeenCalled();
  });
});