/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import fs from 'fs';
import path from 'path';
import {URL} from 'url';

import {compile} from './compile.js';
import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as file from '../../utils/file.js';
import * as logUtils from '../../utils/log.js';

// Mock dependencies
jest.mock('execa');
jest.mock('fs');
jest.mock('path');
jest.mock('url');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/file.js');
jest.mock('../../utils/log.js');

// Mock glob module
jest.mock('glob', () => ({
  sync: jest.fn(() => [])
}));

describe('compile options tests', () => {
  let mockSpinner: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock spinner
    mockSpinner = {
      start: jest.fn(),
      succeed: jest.fn(),
      fail: jest.fn()
    };

    // Mock LexConfig
    (LexConfig.parseConfig as jest.Mock).mockResolvedValue({});
    (LexConfig.config as any) = {
      outputFullPath: '/output',
      sourceFullPath: '/source',
      useTypescript: true
    };
    (LexConfig.checkTypescriptConfig as jest.Mock).mockImplementation(() => {});

    // Mock app utils
    (app.createSpinner as jest.Mock).mockReturnValue(mockSpinner);
    (app.checkLinkedModules as jest.Mock).mockImplementation(() => {});
    (app.removeFiles as jest.Mock).mockResolvedValue(undefined);
    (app.getFilesByExt as jest.Mock).mockReturnValue([]);

    // Mock file system
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.lstatSync as jest.Mock).mockReturnValue({
      isDirectory: () => false
    });

    // Mock path
    (path.extname as jest.Mock).mockReturnValue('.ts');
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    (path.resolve as jest.Mock).mockImplementation((...args) => args.join('/'));

    // Mock URL
    (URL as jest.MockedClass<typeof URL>).mockImplementation(() => ({
      pathname: '/mock/path'
    } as unknown as URL));

    // Mock execa
    (execa as unknown as jest.Mock).mockResolvedValue({
      stdout: 'success',
      stderr: ''
    });

    // Mock file utils
    (file.relativeNodePath as jest.Mock).mockReturnValue('/node_modules/bin');
  });

  test('should use custom source and output paths', async () => {
    const mockCallback = jest.fn();
    const cmdOptions = {
      sourcePath: './custom-src',
      outputPath: './custom-dist',
      quiet: false
    };

    await compile(cmdOptions, mockCallback);

    // Should resolve custom paths
    expect(path.resolve).toHaveBeenCalledWith(expect.anything(), './custom-src');
    expect(LexConfig.config.outputFullPath).toBe('/output');
    expect(cmdOptions.outputPath).toBe('./custom-dist');
  });

  test('should respect the quiet option', async () => {
    const mockCallback = jest.fn();
    const cmdOptions = {
      quiet: true
    };

    await compile(cmdOptions, mockCallback);

    // Should create spinner with quiet mode
    expect(app.createSpinner).toHaveBeenCalledWith(true);
  });

  test('should remove files when remove option is true', async () => {
    const mockCallback = jest.fn();
    const cmdOptions = {
      remove: true,
      quiet: false
    };

    await compile(cmdOptions, mockCallback);

    // Should call removeFiles
    expect(app.removeFiles).toHaveBeenCalled();
  });

  test('should skip removeFiles when remove option is false', async () => {
    const mockCallback = jest.fn();
    const cmdOptions = {
      remove: false,
      quiet: false
    };

    await compile(cmdOptions, mockCallback);

    // Should not call removeFiles
    expect(app.removeFiles).not.toHaveBeenCalled();
  });

  test('should use custom CLI name if provided', async () => {
    const mockCallback = jest.fn();
    const cmdOptions = {
      cliName: 'CustomCLI',
      quiet: false
    };

    await compile(cmdOptions, mockCallback);

    // Should use custom CLI name in logs
    const logCalls = (logUtils.log as jest.Mock).mock.calls;
    expect(logCalls.some((call) => call[0].includes('CustomCLI'))).toBeTruthy();
  });

  test('should use default CLI name if not provided', async () => {
    const mockCallback = jest.fn();
    const cmdOptions = {
      quiet: false
    };

    await compile(cmdOptions, mockCallback);

    // Should use default CLI name 'Lex' in logs
    const logCalls = (logUtils.log as jest.Mock).mock.calls;
    expect(logCalls.some((call) => call[0].includes('Lex'))).toBeTruthy();
  });

  test('should use default callback if none provided', async () => {
    const cmdOptions = {
      quiet: false
    };

    const result = await compile(cmdOptions);

    // Should complete successfully
    expect(result).toBe(0);
  });

  test('should skip TypeScript steps if useTypescript is false', async () => {
    (LexConfig.config as any).useTypescript = false;

    const mockCallback = jest.fn();
    const cmdOptions = {
      quiet: false
    };

    await compile(cmdOptions, mockCallback);

    // Should not call checkTypescriptConfig
    expect(LexConfig.checkTypescriptConfig).not.toHaveBeenCalled();
  });

  test('should pass custom config to TypeScript compiler', async () => {
    const mockCallback = jest.fn();
    const cmdOptions = {
      config: './custom.tsconfig.json',
      quiet: false
    };

    await compile(cmdOptions, mockCallback);

    // Should pass custom config to TypeScript
    expect(execa).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining(['-p', './custom.tsconfig.json']),
      expect.anything()
    );
  });

  test('should include watch flag in esbuild options when watch is true', async () => {
    const mockCallback = jest.fn();
    const cmdOptions = {
      watch: true,
      quiet: false
    };

    await compile(cmdOptions, mockCallback);

    // Should pass watch flag to esbuild
    const execaCalls = (execa as unknown as jest.Mock).mock.calls;
    const esbuildCall = execaCalls.find((call) =>
      call[0].includes('esbuild') && call[1].includes('--watch')
    );

    expect(esbuildCall).toBeDefined();
  });
});