import {execa} from 'execa';
import {existsSync, readFileSync} from 'fs';
import {sync as globSync} from 'glob';
import path from 'path';

import {storybook, StorybookOptions} from './storybook.js';
import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as file from '../../utils/file.js';
import * as log from '../../utils/log.js';

jest.mock('execa');
jest.mock('fs');
jest.mock('glob');
jest.mock('path');
jest.mock('../../LexConfig.js', () => ({
  ...jest.requireActual('../../LexConfig.js'),
  LexConfig: {
    getTypeScriptConfigPath: jest.fn(),
    parseConfig: jest.fn(),
    getLexDir: jest.fn(() => '/mock/lex/dir')
  }
}));
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    start: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn()
  }))
}));
jest.mock('../../utils/file.js');
jest.mock('../../utils/log.js');

jest.useFakeTimers();

let consoleLogSpy: jest.SpyInstance;

beforeAll(() => {
  consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  consoleLogSpy.mockRestore();
  jest.restoreAllMocks();
});

describe('storybook.cli tests', () => {
  let mockCallback: jest.Mock;
  let mockSpinner: {
    start: jest.Mock;
    succeed: jest.Mock;
    fail: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    process.env = {
      NODE_ENV: 'test'
    };

    (existsSync as jest.Mock).mockReturnValue(true);
    (readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
      dependencies: {},
      devDependencies: {
        '@storybook/react': '^7.0.0'
      }
    }));

    (globSync as unknown as jest.Mock).mockReturnValue([
      'src/components/Button.stories.tsx',
      'src/components/Input.stories.tsx'
    ]);

    (path.resolve as jest.Mock).mockImplementation((...args) => args.join('/'));

    mockSpinner = {
      start: jest.fn(),
      succeed: jest.fn(),
      fail: jest.fn()
    };
    (app.createSpinner as jest.Mock).mockReturnValue(mockSpinner);

    (file.resolveBinaryPath as jest.Mock).mockReturnValue('/node_modules/.bin/storybook');

    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({stdout: '', stderr: '', exitCode: 0} as any);

    (LexConfig.parseConfig as jest.Mock).mockResolvedValue(undefined as never);
    LexConfig.config = {
      outputFullPath: './dist',
      useTypescript: true
    };

    mockCallback = jest.fn();
  });

  afterAll(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should start Storybook with default options', async () => {
    const options: StorybookOptions = {
      quiet: false
    };

    const result = await storybook(options, mockCallback);

    jest.runAllTimers();
    await Promise.resolve();

    expect(log.log).toHaveBeenCalledWith('Lex starting Storybook...', 'info', false);
    expect(LexConfig.parseConfig).toHaveBeenCalledWith(options);
    expect(mockSpinner.start).toHaveBeenCalledWith('Finding story files...');
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Found 6 story file(s)');
    expect(execa).toHaveBeenCalledWith(
      '/node_modules/.bin/storybook',
      ['dev', '--config-dir', '/Users/nitrog7/Development/lex/.storybook', '--port', '6007'],
      expect.objectContaining({
        encoding: 'utf8',
        env: {
          LEX_QUIET: false,
          LEX_VERBOSE: false,
          NODE_ENV: 'development',
          STORYBOOK_OPEN: false
        }
      })
    );
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Found 6 story file(s)');
    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should use custom CLI name when provided', async () => {
    const options: StorybookOptions = {
      cliName: 'CustomCLI',
      quiet: false
    };

    await storybook(options, mockCallback);

    jest.runAllTimers();
    await Promise.resolve();

    expect(log.log).toHaveBeenCalledWith('CustomCLI starting Storybook...', 'info', false);
  });

  it('should use custom config when provided', async () => {
    const options: StorybookOptions = {
      config: './custom-storybook',
      quiet: false
    };

    await storybook(options, mockCallback);

    jest.runAllTimers();
    await Promise.resolve();

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

    jest.runAllTimers();
    await Promise.resolve();

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

    jest.runAllTimers();
    await Promise.resolve();

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

    (file.resolveBinaryPath as jest.Mock).mockReturnValue('/node_modules/.bin/storybook');

    await storybook(options, mockCallback);

    jest.runAllTimers();
    await Promise.resolve();

    expect(file.resolveBinaryPath).toHaveBeenCalledWith('storybook');
    expect(mockSpinner.start).toHaveBeenCalledWith('Building static Storybook...');
    expect(execa).toHaveBeenCalledWith(
      '/node_modules/.bin/storybook',
      ['build', '--config-dir', '/Users/nitrog7/Development/lex/.storybook', '--port', '6007', '--output-dir', '/Users/nitrog7/Development/lex/storybook-static'],
      expect.any(Object)
    );
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Found 6 story file(s)');
  });

  it('should handle environment variables when provided as valid JSON', async () => {
    const options: StorybookOptions = {
      variables: '{"STORYBOOK_THEME": "dark", "DEBUG": true}',
      quiet: false
    };

    await storybook(options, mockCallback);

    jest.runAllTimers();
    await Promise.resolve();

    expect(process.env).toEqual(expect.objectContaining({
      NODE_ENV: 'test',
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

    jest.runAllTimers();
    await Promise.resolve();

    expect(log.log).toHaveBeenCalledWith(
      '\nLex Error: Environment variables option is not a valid JSON object.',
      'error',
      false
    );
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  it('should handle Storybook not installed', async () => {
    const options: StorybookOptions = {};

    // Mock no story files found to trigger the "not installed" error path
    (globSync as unknown as jest.Mock).mockReturnValue([]);

    await storybook(options, mockCallback);
    jest.runAllTimers();
    await Promise.resolve();

    expect(log.log).toHaveBeenCalledWith(
      'Please create story files with .stories.ts/.stories.js extensions or in a stories/ directory.',
      'info',
      undefined
    );
    expect(mockSpinner.fail).toHaveBeenCalledWith('No story files found in the project.');
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  it('should handle Storybook binary not found', async () => {
    const options: StorybookOptions = {
      quiet: false
    };

    (file.resolveBinaryPath as jest.Mock).mockReturnValue(null);

    const result = await storybook(options, mockCallback);

    jest.runAllTimers();
    await Promise.resolve();

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
    const options: StorybookOptions = {};

    // Mock execa to fail
    (execa as jest.MockedFunction<typeof execa>).mockRejectedValue(new Error('Storybook failed to start'));

    const result = await storybook(options, mockCallback);
    jest.runAllTimers();
    await Promise.resolve();

    const errorMessage = 'Storybook failed to start';

    expect(log.log).toHaveBeenCalledWith(`\nLex Error: ${errorMessage}`, 'error', undefined);
    expect(mockSpinner.fail).toHaveBeenCalledWith('There was an error while running storybook.');
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  it('should respect quiet option', async () => {
    const options: StorybookOptions = {
      quiet: true
    };

    await storybook(options, mockCallback);

    jest.runAllTimers();
    await Promise.resolve();

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