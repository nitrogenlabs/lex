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

// Mock dependencies
jest.mock('execa');
jest.mock('fs');
jest.mock('path');
jest.mock('url');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/file.js');

// Mock glob module
jest.mock('glob', () => ({
  sync: jest.fn((pattern) => {
    if(pattern.includes('ts*')) {
      return ['file1.ts', 'file2.tsx'];
    }
    if(pattern.includes('.js')) {
      return ['file1.js'];
    }
    return [];
  })
}));

describe('compile integration tests', () => {
  let mockSpinner: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock file system
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.lstatSync as jest.Mock).mockReturnValue({
      isDirectory: () => false
    });

    // Mock path
    (path.extname as jest.Mock).mockImplementation((file) => {
      if(file.includes('.css')) {
        return '.css';
      }
      if(file.includes('.ts')) {
        return '.ts';
      }
      if(file.includes('.js')) {
        return '.js';
      }
      if(file.includes('.png')) {
        return '.png';
      }
      return '';
    });
    (path.resolve as jest.Mock).mockImplementation((...args) => args.join('/'));
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));

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
    (app.removeFiles as jest.Mock).mockResolvedValue(undefined);
    (app.copyFiles as jest.Mock).mockResolvedValue(undefined);
    (app.getFilesByExt as jest.Mock).mockImplementation((ext) => {
      if(ext === '.css') {
        return ['file1.css'];
      }
      if(ext === '.png') {
        return ['file1.png'];
      }
      if(ext === '.md') {
        return ['file1.md'];
      }
      return [];
    });
    (app.checkLinkedModules as jest.Mock).mockImplementation(() => {});

    // Mock URL
    (URL as jest.MockedClass<typeof URL>).mockImplementation(() => ({
      pathname: '/mock/path'
    } as URL));

    // Mock file utils
    (file.relativeNodePath as jest.Mock).mockImplementation((module) => `/node_modules/${module}`);

    // Mock execa
    (execa as unknown as jest.Mock).mockResolvedValue({
      stdout: 'success',
      stderr: ''
    });
  });

  test('should compile typescript files successfully', async () => {
    const mockCallback = jest.fn();
    const cmd = {
      quiet: false,
      cliName: 'TestLex',
      useTypescript: true
    };

    const result = await compile(cmd, mockCallback);

    // Should call typescript compiler
    expect(file.relativeNodePath).toHaveBeenCalledWith('typescript/bin/tsc', expect.anything());
    expect(execa).toHaveBeenCalled();

    // Should call esbuild
    expect(file.relativeNodePath).toHaveBeenCalledWith('esbuild/bin/esbuild', expect.anything());
    expect(execa).toHaveBeenCalledWith(
      '/node_modules/esbuild/bin/esbuild',
      expect.arrayContaining(['--color=true', '--format=cjs', '--platform=node']),
      expect.anything()
    );

    // Should process CSS files
    expect(file.relativeNodePath).toHaveBeenCalledWith('postcss-cli/index.js', expect.anything());

    // Should display success messages
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Successfully formatted 1 css files!');
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Compile completed successfully!');

    // Should complete successfully
    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  test('should handle file copying operations', async () => {
    const mockCallback = jest.fn();
    const cmd = {quiet: false};

    await compile(cmd, mockCallback);

    // Should copy image files
    expect(app.getFilesByExt).toHaveBeenCalledWith('.png', expect.anything());
    expect(app.copyFiles).toHaveBeenCalledWith(['file1.png'], 'image', expect.anything(), expect.anything());

    // Should copy markdown files
    expect(app.getFilesByExt).toHaveBeenCalledWith('.md', expect.anything());
    expect(app.copyFiles).toHaveBeenCalledWith(['file1.md'], 'documents', expect.anything(), expect.anything());
  });

  test('should handle postcss error', async () => {
    (execa as unknown as jest.Mock).mockImplementationOnce(() => {
      throw new Error('PostCSS Error');
    });

    const mockCallback = jest.fn();
    const cmd = {quiet: false};

    const result = await compile(cmd, mockCallback);

    // Should handle error
    expect(mockSpinner.fail).toHaveBeenCalledWith('Failed formatting css.');
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  test('should handle esbuild error', async () => {
    // Make TypeScript compilation pass but ESBuild fail
    (execa as unknown as jest.Mock)
      .mockResolvedValueOnce({stdout: 'success', stderr: ''})  // For TypeScript
      .mockImplementationOnce(() => {                            // For ESBuild
        throw new Error('ESBuild Error');
      });

    const mockCallback = jest.fn();
    const cmd = {quiet: false};

    const result = await compile(cmd, mockCallback);

    // Should handle error
    expect(mockSpinner.fail).toHaveBeenCalledWith('Code compiling failed.');
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  test('should handle watch mode', async () => {
    const mockCallback = jest.fn();
    const cmd = {
      quiet: false,
      watch: true
    };

    await compile(cmd, mockCallback);

    // Should pass watch flag to esbuild
    expect(execa).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining(['--watch']),
      expect.anything()
    );

    // Should update spinner message
    expect(mockSpinner.start).toHaveBeenCalledWith('Watching for changes...');
  });

  test('should handle custom configuration', async () => {
    const mockCallback = jest.fn();
    const cmd = {
      quiet: false,
      config: './custom.tsconfig.json'
    };

    await compile(cmd, mockCallback);

    // Should pass config to TypeScript
    expect(execa).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining(['-p', './custom.tsconfig.json']),
      expect.anything()
    );
  });
});