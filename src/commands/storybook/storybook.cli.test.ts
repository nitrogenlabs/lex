/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import {existsSync, readFileSync} from 'fs';
import {sync as globSync} from 'glob';
import path from 'path';

import {storybook, StorybookOptions} from './storybook.js';
import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as file from '../../utils/file.js';
import * as log from '../../utils/log.js';

// Mock dependencies
jest.mock('execa');
jest.mock('fs');
jest.mock('glob');
jest.mock('path');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/file.js');
jest.mock('../../utils/log.js');

describe('storybook.cli tests', () => {
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

    // Mock fs
    (existsSync as jest.Mock).mockReturnValue(true);
    (readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
      dependencies: {},
      devDependencies: {
        '@storybook/react': '^7.0.0'
      }
    }));

    // Mock glob
    (globSync as unknown as jest.Mock).mockReturnValue([
      'src/components/Button.stories.tsx',
      'src/components/Input.stories.tsx'
    ]);

    // Mock path
    (path.resolve as jest.Mock).mockImplementation((...args) => args.join('/'));

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
    (execa as unknown as jest.Mock).mockResolvedValue({
      stdout: 'storybook output',
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

  it('should start Storybook with default options', async () => {
    const options: StorybookOptions = {
      quiet: false
    };

    const result = await storybook(options, mockCallback);

    expect(log.log).toHaveBeenCalledWith('Lex starting Storybook...', 'info', false);
    expect(LexConfig.parseConfig).toHaveBeenCalledWith(options);
    expect(mockSpinner.start).toHaveBeenCalledWith('Finding story files...');
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Found 2 story file(s)');
    expect(execa).toHaveBeenCalledWith(
      '/node_modules/.bin/storybook',
      [],
      expect.objectContaining({
        encoding: 'utf8',
        env: {
          LEX_QUIET: false,
          STORYBOOK_OPEN: false,
          NODE_ENV: 'development'
        }
      })
    );
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Storybook development server started.');
    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should use custom CLI name when provided', async () => {
    const options: StorybookOptions = {
      cliName: 'CustomCLI',
      quiet: false
    };

    await storybook(options, mockCallback);

    expect(log.log).toHaveBeenCalledWith('CustomCLI starting Storybook...', 'info', false);
  });

  it('should use custom config when provided', async () => {
    const options: StorybookOptions = {
      config: './custom-storybook',
      quiet: false
    };

    await storybook(options, mockCallback);

    expect(execa).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['--config-dir', './custom-storybook']),
      expect.any(Object)
    );
  });

  it('should enable open option when requested', async () => {
    const options: StorybookOptions = {
      open: true,
      quiet: false
    };

    await storybook(options, mockCallback);

    expect(execa).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['--open']),
      expect.objectContaining({
        env: expect.objectContaining({
          STORYBOOK_OPEN: true
        })
      })
    );
  });

  it('should use custom port when provided', async () => {
    const options: StorybookOptions = {
      port: 6007,
      quiet: false
    };

    await storybook(options, mockCallback);

    expect(execa).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['--port', '6007']),
      expect.any(Object)
    );
  });

  it('should build static site when static option is true', async () => {
    const options: StorybookOptions = {
      static: true,
      quiet: false
    };

    (file.resolveBinaryPath as jest.Mock).mockReturnValue('/node_modules/.bin/storybook-build');

    await storybook(options, mockCallback);

    expect(file.resolveBinaryPath).toHaveBeenCalledWith('storybook-build');
    expect(mockSpinner.start).toHaveBeenCalledWith('Building static Storybook...');
    expect(execa).toHaveBeenCalledWith(
      '/node_modules/.bin/storybook-build',
      expect.arrayContaining(['--output-dir', '/storybook-static']),
      expect.any(Object)
    );
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Static Storybook built successfully.');
  });

  it('should handle environment variables when provided as valid JSON', async () => {
    const options: StorybookOptions = {
      variables: '{"STORYBOOK_THEME": "dark", "DEBUG": true}',
      quiet: false
    };

    await storybook(options, mockCallback);

    expect(process.env).toEqual(expect.objectContaining({
      NODE_ENV: 'development',
      STORYBOOK_THEME: 'dark',
      DEBUG: true
    }));
  });

  it('should handle invalid environment variables JSON', async () => {
    const options: StorybookOptions = {
      variables: '{invalid-json}',
      quiet: false
    };

    const result = await storybook(options, mockCallback);

    expect(log.log).toHaveBeenCalledWith(
      '\nLex Error: Environment variables option is not a valid JSON object.',
      'error',
      false
    );
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  it('should handle Storybook not installed', async () => {
    const options: StorybookOptions = {
      quiet: false
    };

    (readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
      dependencies: {},
      devDependencies: {}
    }));

    const result = await storybook(options, mockCallback);

    expect(log.log).toHaveBeenCalledWith(
      '\nLex Error: Storybook is not installed in this project.',
      'error',
      false
    );
    expect(log.log).toHaveBeenCalledWith(
      'Please install Storybook first: npm install --save-dev @storybook/react',
      'info',
      false
    );
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  it('should handle no story files found', async () => {
    const options: StorybookOptions = {
      quiet: false
    };

    (globSync as unknown as jest.Mock).mockReturnValue([]);

    const result = await storybook(options, mockCallback);

    expect(mockSpinner.fail).toHaveBeenCalledWith('No story files found in the project.');
    expect(log.log).toHaveBeenCalledWith(
      'Please create story files with .stories.ts/.stories.js extensions or in a stories/ directory.',
      'info',
      false
    );
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  it('should handle Storybook binary not found', async () => {
    const options: StorybookOptions = {
      quiet: false
    };

    (file.resolveBinaryPath as jest.Mock).mockReturnValue(null);

    const result = await storybook(options, mockCallback);

    expect(log.log).toHaveBeenCalledWith(
      '\nLex Error: storybook binary not found in Lex\'s node_modules or monorepo root',
      'error',
      false
    );
    expect(log.log).toHaveBeenCalledWith(
      'Please reinstall Lex or check your Storybook installation.',
      'info',
      false
    );
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  it('should handle Storybook execution errors', async () => {
    const options: StorybookOptions = {
      quiet: false
    };

    const errorMessage = 'Storybook failed to start';
    (execa as unknown as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const result = await storybook(options, mockCallback);

    expect(log.log).toHaveBeenCalledWith(`\nLex Error: ${errorMessage}`, 'error', false);
    expect(mockSpinner.fail).toHaveBeenCalledWith('There was an error while running storybook.');
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  it('should respect quiet option', async () => {
    const options: StorybookOptions = {
      quiet: true
    };

    await storybook(options, mockCallback);

    expect(log.log).toHaveBeenCalledWith('Lex starting Storybook...', 'info', true);
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