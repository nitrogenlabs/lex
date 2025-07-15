/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import fs from 'fs';
import path from 'path';

// Import mocks at the top level
import {compile, hasFileType} from './compile.js';
import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as file from '../../utils/file.js';
import * as log from '../../utils/log.js';

jest.mock('execa');
jest.mock('fs');
jest.mock('path');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/file.js');
jest.mock('../../utils/log.js');

describe('compile.cli tests', () => {
  let spinnerMock: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock spinner
    spinnerMock = {
      start: jest.fn(),
      succeed: jest.fn(),
      fail: jest.fn()
    };

    (app.createSpinner as jest.Mock).mockReturnValue(spinnerMock);
    (app.checkLinkedModules as jest.Mock).mockImplementation(() => {});
    (app.removeFiles as jest.Mock).mockResolvedValue(undefined);
    (app.copyFiles as jest.Mock).mockResolvedValue(undefined);
    (app.getFilesByExt as jest.Mock).mockReturnValue([]);

    // Mock filesystem
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.lstatSync as jest.Mock).mockReturnValue({
      isDirectory: () => false
    });
    (fs.readdirSync as jest.Mock).mockReturnValue(['file.ts']);

    // Mock path functions
    (path.extname as jest.Mock).mockReturnValue('.ts');
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    (path.resolve as jest.Mock).mockImplementation((...args) => args.join('/'));

    // Mock url module
    global.URL = jest.fn() as any;
    (global.URL as any).prototype.pathname = '/mock/path';

    // Mock LexConfig
    (LexConfig.parseConfig as jest.Mock).mockResolvedValue({});
    (LexConfig.config as any) = {
      outputFullPath: '/output',
      sourceFullPath: '/source',
      useTypescript: true
    };
    (LexConfig.checkTypescriptConfig as jest.Mock).mockImplementation(() => {});

    // Mock execa
    (execa as unknown as jest.Mock).mockResolvedValue({
      stdout: 'success',
      stderr: ''
    });

    // Mock file utils
    (file.relativeNodePath as jest.Mock).mockReturnValue('/node_modules/bin');
  });

  test('hasFileType should check for file extensions', () => {
    expect(hasFileType('/test/path', ['.ts'])).toBe(true);

    // Check recursive search
    (fs.lstatSync as jest.Mock).mockReturnValueOnce({
      isDirectory: () => true
    });

    expect(hasFileType('/test/path', ['.ts'])).toBe(true);

    // Test with non-matching extension
    (path.extname as jest.Mock).mockReturnValueOnce('.js');
    expect(hasFileType('/test/path', ['.ts'])).toBe(false);

    // Test with non-existent path
    (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
    expect(hasFileType('/nonexistent', ['.ts'])).toBe(false);
  });

  test('compile should execute typescript and esbuild', async () => {
    // Setup mock for glob
    jest.mock('glob', () => ({
      sync: jest.fn(() => ['file1.ts', 'file2.ts'])
    }));

    const mockCallback = jest.fn();
    const cmdOptions = {
      cliName: 'TestCLI',
      quiet: false,
      remove: true
    };

    // Execute the compile function
    const result = await compile(cmdOptions, mockCallback);

    // Verify basic setup
    expect(app.createSpinner).toHaveBeenCalledWith(false);
    expect(log.log).toHaveBeenCalledWith('TestCLI compiling...', 'info', false);
    expect(LexConfig.parseConfig).toHaveBeenCalledWith(cmdOptions);

    // Check TypeScript validation calls
    expect(LexConfig.checkTypescriptConfig).toHaveBeenCalled();
    expect(spinnerMock.start).toHaveBeenCalledWith('Static type checking with Typescript...');
    expect(file.relativeNodePath).toHaveBeenCalledWith('typescript/bin/tsc', expect.anything());
    expect(execa).toHaveBeenCalled();
    expect(spinnerMock.succeed).toHaveBeenCalledWith('Successfully completed type checking!');

    // Check esbuild calls
    expect(spinnerMock.start).toHaveBeenCalledWith('Compiling with ESBuild...');
    expect(file.relativeNodePath).toHaveBeenCalledWith('esbuild/bin/esbuild', expect.anything());
    expect(execa).toHaveBeenCalled();
    expect(spinnerMock.succeed).toHaveBeenCalledWith('Compile completed successfully!');

    // Check final result
    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  test('compile should handle typescript errors', async () => {
    // Setup mock for typescript error
    (execa as unknown as jest.Mock).mockRejectedValueOnce({
      message: 'TypeScript error'
    });

    const mockCallback = jest.fn();
    const cmdOptions = {
      cliName: 'TestCLI',
      quiet: false
    };

    // Execute the compile function
    const result = await compile(cmdOptions, mockCallback);

    // Check error handling
    expect(log.log).toHaveBeenCalledWith('\nTestCLI Error: TypeScript error', 'error', false);
    expect(spinnerMock.fail).toHaveBeenCalledWith('Type checking failed.');

    // Check final result
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  test('compile should handle watch mode', async () => {
    const mockCallback = jest.fn();
    const cmdOptions = {
      cliName: 'TestCLI',
      quiet: false,
      watch: true
    };

    // Execute the compile function
    await compile(cmdOptions, mockCallback);

    // Check if spinner message reflects watch mode
    expect(spinnerMock.start).toHaveBeenCalledWith('Watching for changes...');
  });

  test('compile should handle custom paths', async () => {
    const mockCallback = jest.fn();
    const cmdOptions = {
      cliName: 'TestCLI',
      quiet: false,
      sourcePath: './custom/source',
      outputPath: './custom/output'
    };

    // Execute the compile function
    await compile(cmdOptions, mockCallback);

    // Check if custom paths are used
    expect(path.resolve).toHaveBeenCalledWith(expect.anything(), './custom/source');
  });
});