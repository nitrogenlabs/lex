/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'fs';
import {sync as globSync} from 'glob';
import {resolve as pathResolve} from 'path';


import {storybook, StorybookOptions} from './storybook.js';
import {LexConfig} from '../../LexConfig.js';
import {clearExecaMocks, mockExecaFailure} from '../../mocks/execaMock.js';
import * as app from '../../utils/app.js';
import * as file from '../../utils/file.js';

// Mock dependencies
// execa mock is now global
jest.mock('fs');
jest.mock('glob');
jest.mock('path');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/file.js');
jest.mock('../../utils/log.js');

describe('storybook.integration tests', () => {
  let mockCallback: jest.Mock;
  let mockSpinner: {
    start: jest.Mock;
    succeed: jest.Mock;
    fail: jest.Mock;
  };
  let tempDir: string;

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    clearExecaMocks();

    // Create temp directory
    tempDir = '/tmp/lex-storybook-test';
    process.cwd = jest.fn().mockReturnValue(tempDir);

    // Mock process.env
    process.env = {
      NODE_ENV: 'test'
    };

    // Mock fs operations
    (existsSync as jest.Mock).mockImplementation((path: string) => path.includes('package.json') || path.includes('node_modules'));
    (readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
      dependencies: {},
      devDependencies: {
        '@storybook/react': '^7.0.0'
      }
    }));
    (writeFileSync as jest.Mock).mockImplementation(() => {});
    (mkdirSync as jest.Mock).mockImplementation(() => {});
    (rmSync as jest.Mock).mockImplementation(() => {});

    // Mock glob
    (globSync as unknown as jest.Mock).mockReturnValue([
      'src/components/Button.stories.tsx',
      'src/components/Input.stories.tsx',
      'stories/Header.stories.tsx'
    ]);

    // Mock path
    (pathResolve as jest.Mock).mockImplementation((...args) => args.join('/'));

    // Mock spinner
    mockSpinner = {
      start: jest.fn(),
      succeed: jest.fn(),
      fail: jest.fn()
    };
    (app.createSpinner as jest.Mock).mockReturnValue(mockSpinner);

    // Mock file utilities
    (file.resolveBinaryPath as jest.Mock).mockReturnValue('/node_modules/.bin/storybook');

    // Mock execa
    // mockExecaSuccess(); // REMOVE, rely on global mock

    // Mock LexConfig
    LexConfig.parseConfig = jest.fn().mockResolvedValue(undefined);
    LexConfig.config = {
      outputFullPath: './dist',
      useTypescript: true
    };

    // Mock callback
    mockCallback = jest.fn();
  });

  it('should find story files in multiple locations', async () => {
    const options: StorybookOptions = {
      quiet: false
    };

    await storybook(options, mockCallback);

    expect(globSync).toHaveBeenCalledWith('**/*.stories.{ts,tsx,js,jsx}', {
      cwd: tempDir,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });
    expect(globSync).toHaveBeenCalledWith('**/*.story.{ts,tsx,js,jsx}', {
      cwd: tempDir,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });
    expect(globSync).toHaveBeenCalledWith('**/stories/**/*.{ts,tsx,js,jsx}', {
      cwd: tempDir,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });
  });

  it('should check for Storybook installation in package.json', async () => {
    const options: StorybookOptions = {
      quiet: false
    };

    await storybook(options, mockCallback);

    expect(existsSync).toHaveBeenCalledWith('/tmp/lex-storybook-test/package.json');
    expect(readFileSync).toHaveBeenCalledWith('/tmp/lex-storybook-test/package.json', 'utf8');
  });

  it('should handle different Storybook framework installations', async () => {
    const frameworks = [
      '@storybook/react',
      '@storybook/vue',
      '@storybook/angular',
      '@storybook/web-components',
      'storybook'
    ];

    for(const framework of frameworks) {
      (readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
        dependencies: {},
        devDependencies: {
          [framework]: '^7.0.0'
        }
      }));

      const options: StorybookOptions = {
        quiet: false
      };

      await storybook(options, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(0);
      mockCallback.mockClear();
    }
  });

  it('should handle static build with output directory', async () => {
    const options: StorybookOptions = {
      static: true,
      quiet: false
    };

    (file.resolveBinaryPath as jest.Mock).mockReturnValue('/node_modules/.bin/storybook-build');

    await storybook(options, mockCallback);

    expect(pathResolve).toHaveBeenCalledWith(tempDir, 'storybook-static');
    expect(execa).toHaveBeenCalledWith(
      '/node_modules/.bin/storybook-build',
      expect.arrayContaining(['--output-dir', '/tmp/lex-storybook-test/storybook-static']),
      expect.any(Object)
    );
  });

  it('should handle custom configuration directory', async () => {
    const options: StorybookOptions = {
      config: './custom-storybook',
      quiet: false
    };

    await storybook(options, mockCallback);

    expect(execa).toHaveBeenCalledWith(
      '/node_modules/.bin/storybook',
      ['--config-dir', './custom-storybook'],
      expect.any(Object)
    );
  });

  it('should handle custom port configuration', async () => {
    const options: StorybookOptions = {
      port: 6007,
      quiet: false
    };

    await storybook(options, mockCallback);

    expect(execa).toHaveBeenCalledWith(
      '/node_modules/.bin/storybook',
      ['--port', '6007'],
      expect.any(Object)
    );
  });

  it('should handle multiple options together', async () => {
    const options: StorybookOptions = {
      config: './.storybook',
      open: true,
      port: 6007,
      quiet: false
    };

    await storybook(options, mockCallback);

    expect(execa).toHaveBeenCalledWith(
      '/node_modules/.bin/storybook',
      ['--config-dir', './.storybook', '--port', '6007', '--open'],
      expect.objectContaining({
        env: expect.objectContaining({
          STORYBOOK_OPEN: true
        })
      })
    );
  });

  it('should handle environment variables integration', async () => {
    const options: StorybookOptions = {
      variables: '{"STORYBOOK_THEME": "dark", "DEBUG": true, "NODE_ENV": "development"}',
      quiet: false
    };

    await storybook(options, mockCallback);

    expect(process.env).toEqual(expect.objectContaining({
      NODE_ENV: 'development',
      STORYBOOK_THEME: 'dark',
      DEBUG: true
    }));
  });

  it('should handle package.json not found', async () => {
    const options: StorybookOptions = {
      quiet: false
    };

    (existsSync as jest.Mock).mockReturnValue(false);

    const result = await storybook(options, mockCallback);

    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  it('should handle invalid package.json', async () => {
    const options: StorybookOptions = {
      quiet: false
    };

    (readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid JSON');
    });

    const result = await storybook(options, mockCallback);

    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  it('should handle empty story files array', async () => {
    const options: StorybookOptions = {
      quiet: false
    };

    (globSync as unknown as jest.Mock).mockReturnValue([]);

    const result = await storybook(options, mockCallback);

    expect(mockSpinner.fail).toHaveBeenCalledWith('No story files found in the project.');
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  it('should handle Storybook binary resolution failure', async () => {
    const options: StorybookOptions = {
      quiet: false
    };

    (file.resolveBinaryPath as jest.Mock).mockReturnValue(null);

    const result = await storybook(options, mockCallback);

    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  it('should handle execa execution failure', async () => {
    const options: StorybookOptions = {
      quiet: false
    };

    mockExecaFailure('Storybook failed to start');

    const result = await storybook(options, mockCallback);

    expect(mockSpinner.fail).toHaveBeenCalledWith('There was an error while running storybook.');
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });
});