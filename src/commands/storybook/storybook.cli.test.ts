import {execa} from 'execa';
import {existsSync, readFileSync} from 'fs';
import {sync as globSync} from 'glob';
import path from 'path';

import {storybook, StorybookOptions} from './storybook.js';
import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as file from '../../utils/file.js';
import * as log from '../../utils/log.js';

vi.mock('execa');
vi.mock('fs');
vi.mock('glob');
vi.mock('path');
vi.mock('../../LexConfig.js', async () => ({
  ...await vi.importActual('../../LexConfig.js'),
  LexConfig: {
    getLexDir: vi.fn(() => '/mock/lex/dir'),
    getTypeScriptConfigPath: vi.fn(),
    parseConfig: vi.fn()
  }
}));
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  createSpinner: vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn()
  }))
}));
vi.mock('../../utils/file.js');
vi.mock('../../utils/log.js');

vi.useFakeTimers();

let consoleLogSpy: SpyInstance;

beforeAll(() => {
  consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  consoleLogSpy.mockRestore();
  vi.restoreAllMocks();
});

describe('storybook.cli tests', () => {
  let mockCallback: Mock;
  let mockSpinner: {
    start: Mock;
    succeed: Mock;
    fail: Mock;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    process.env = {
      NODE_ENV: 'test'
    };

    (existsSync as Mock).mockReturnValue(true);
    (readFileSync as Mock).mockReturnValue(JSON.stringify({
      dependencies: {},
      devDependencies: {
        '@storybook/react': '^7.0.0'
      }
    }));

    (globSync as unknown as Mock).mockReturnValue([
      'src/components/Button.stories.tsx',
      'src/components/Input.stories.tsx'
    ]);

    (path.resolve as Mock).mockImplementation((...args) => args.join('/'));

    mockSpinner = {
      fail: vi.fn(),
      start: vi.fn(),
      succeed: vi.fn()
    };
    (app.createSpinner as Mock).mockReturnValue(mockSpinner);

    (file.resolveBinaryPath as Mock).mockReturnValue('/node_modules/.bin/storybook');

    (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);

    (LexConfig.parseConfig as Mock).mockResolvedValue(undefined as never);
    LexConfig.config = {
      outputFullPath: './lib',
      useTypescript: true
    };

    mockCallback = vi.fn();
  });

  afterAll(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should start Storybook with default options', async () => {
    const options: StorybookOptions = {
      quiet: false
    };

    const result = await storybook(options, mockCallback);

    vi.runAllTimers();
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

    vi.runAllTimers();
    await Promise.resolve();

    expect(log.log).toHaveBeenCalledWith('CustomCLI starting Storybook...', 'info', false);
  });

  it('should use custom config when provided', async () => {
    const options: StorybookOptions = {
      config: './custom-storybook',
      quiet: false
    };

    await storybook(options, mockCallback);

    vi.runAllTimers();
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

    vi.runAllTimers();
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

    vi.runAllTimers();
    await Promise.resolve();

    expect(execa).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['--port', '6007']),
      expect.any(Object)
    );
  });

  it('should build static site when static option is true', async () => {
    const options: StorybookOptions = {
      quiet: false,
      static: true
    };

    (file.resolveBinaryPath as Mock).mockReturnValue('/node_modules/.bin/storybook');

    await storybook(options, mockCallback);

    vi.runAllTimers();
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
      quiet: false,
      variables: '{"STORYBOOK_THEME": "dark", "DEBUG": true}'
    };

    await storybook(options, mockCallback);

    vi.runAllTimers();
    await Promise.resolve();

    expect(process.env).toEqual(expect.objectContaining({
      DEBUG: true,
      NODE_ENV: 'test',
      STORYBOOK_THEME: 'dark'
    }));
  });

  it('should handle invalid environment variables JSON', async () => {
    const options: StorybookOptions = {
      quiet: false,
      variables: '{invalid-json}'
    };

    const result = await storybook(options, mockCallback);

    vi.runAllTimers();
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
    (globSync as unknown as Mock).mockReturnValue([]);

    await storybook(options, mockCallback);
    vi.runAllTimers();
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

    (file.resolveBinaryPath as Mock).mockReturnValue(null);

    const result = await storybook(options, mockCallback);

    vi.runAllTimers();
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
    (execa as MockedFunction<typeof execa>).mockRejectedValue(new Error('Storybook failed to start'));

    const result = await storybook(options, mockCallback);
    vi.runAllTimers();
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

    vi.runAllTimers();
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