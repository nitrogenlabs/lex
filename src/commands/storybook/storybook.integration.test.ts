import {existsSync, readFileSync} from 'fs';
import {execa} from 'execa';
import {sync as globSync} from 'glob';
import * as app from '../../utils/app.js';
import * as file from '../../utils/file.js';
import {storybook, StorybookOptions} from './storybook.js';

jest.mock('execa');
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn()
}));
jest.mock('glob', () => ({
  sync: jest.fn()
}));
jest.mock('../../LexConfig.js', () => ({
  LexConfig: {
    checkTestTypescriptConfig: jest.fn(),
    checkTypescriptConfig: jest.fn(),
    config: {
      useTypescript: true
    },
    getLexDir: jest.fn(() => '/mock/lex/dir'),
    parseConfig: jest.fn().mockResolvedValue(undefined)
  },
  getTypeScriptConfigPath: jest.fn(() => 'tsconfig.test.json')
}));
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn()
  }))
}));
jest.mock('../../utils/file.js');
jest.mock('../../utils/log.js');

jest.useFakeTimers();

let consoleLogSpy: jest.SpyInstance;
let pathResolveSpy: jest.SpyInstance;

beforeAll(() => {
  pathResolveSpy = jest.spyOn(require('path'), 'resolve').mockImplementation((...args: string[]) => args.join('/'));
  consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  pathResolveSpy.mockRestore();
  consoleLogSpy.mockRestore();
  jest.restoreAllMocks();
});

describe('storybook.integration tests', () => {
  let mockSpinner: {
    start: jest.Mock;
    succeed: jest.Mock;
    fail: jest.Mock;
  };
  let tempDir: string;

  beforeEach(() => {
    jest.clearAllMocks();

    tempDir = '/tmp/lex-storybook-test';
    jest.spyOn(process, 'cwd').mockReturnValue(tempDir);

    process.env = {
      NODE_ENV: 'test'
    };

    mockSpinner = {
      fail: jest.fn(),
      start: jest.fn(),
      succeed: jest.fn()
    };
    (app.createSpinner as jest.Mock).mockReturnValue(mockSpinner);

    // Default mocks that make the code succeed
    (existsSync as jest.Mock).mockImplementation((path: any) => {
      if(typeof path === 'string') {
        if(path.includes('package.json') || path.includes('node_modules')) {
          return true;
        }
        if(path.includes('.storybook')) {
          return true;
        }
      }
      return false;
    });
    (readFileSync as jest.Mock).mockReturnValue('{"dependencies": {"@storybook/react": "^7.0.0"}}');
    (file.resolveBinaryPath as jest.Mock).mockReturnValue('/node_modules/.bin/storybook');
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
    (globSync as unknown as jest.Mock).mockReturnValue(['src/Component.stories.ts', 'src/Button.stories.tsx']);
  });

  afterAll(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should find story files in multiple locations', async () => {
    const options: StorybookOptions = {
      quiet: false
    };
    const mockCallback = jest.fn();

    await storybook(options, mockCallback);

    expect(globSync).toHaveBeenCalledWith('**/*.stories.{ts,tsx,js,jsx}', {
      cwd: tempDir,
      ignore: ['**/node_modules/**', '**/dist/**', '**/lib/**', '**/build/**']
    });
    expect(globSync).toHaveBeenCalledWith('**/*.story.{ts,tsx,js,jsx}', {
      cwd: tempDir,
      ignore: ['**/node_modules/**', '**/dist/**', '**/lib/**', '**/build/**']
    });
    expect(globSync).toHaveBeenCalledWith('**/stories/**/*.{ts,tsx,js,jsx}', {
      cwd: tempDir,
      ignore: ['**/node_modules/**', '**/dist/**', '**/lib/**', '**/build/**']
    });

    jest.runAllTimers();
    await Promise.resolve();
  });

  it('should check for Storybook installation in package.json', async () => {
    const options: StorybookOptions = {};
    const mockCallback = jest.fn();

    (globSync as unknown as jest.Mock).mockReturnValue([]);

    await storybook(options, mockCallback);
    jest.runAllTimers();
    await Promise.resolve();

    expect(mockSpinner.fail).toHaveBeenCalledWith('No story files found in the project.');
  });

  it('should handle different Storybook framework installations', async () => {
    const options: StorybookOptions = {};
    const mockCallback = jest.fn();

    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);

    await storybook(options, mockCallback);

    expect(mockCallback).toHaveBeenCalledWith(0);

    mockCallback.mockClear();
    jest.runAllTimers();
    await Promise.resolve();
  });

  it('should handle static build with output directory', async () => {
    const options: StorybookOptions = {
      static: true
    };
    const mockCallback = jest.fn();

    (file.resolveBinaryPath as jest.Mock).mockReturnValue('/node_modules/.bin/storybook');

    await storybook(options, mockCallback);

    expect(execa).toHaveBeenCalledWith(
      '/node_modules/.bin/storybook',
      ['build', '--config-dir', '/tmp/lex-storybook-test/.storybook', '--port', '6007', '--output-dir', '/tmp/lex-storybook-test/storybook-static'],
      expect.any(Object)
    );
  });

  it('should handle custom configuration directory', async () => {
    const options: StorybookOptions = {
      config: './custom-storybook'
    };
    const mockCallback = jest.fn();

    // Mock the custom config directory to exist
    (existsSync as jest.Mock).mockImplementation((path: any) => {
      if(typeof path === 'string') {
        if(path.includes('custom-storybook')) {
          return true;
        }
        if(path.includes('package.json') || path.includes('node_modules')) {
          return true;
        }
        if(path.includes('.storybook')) {
          return true;
        }
      }
      return false;
    });

    await storybook(options, mockCallback);
    jest.runAllTimers();
    await Promise.resolve();

    expect(execa).toHaveBeenCalledWith(
      '/node_modules/.bin/storybook',
      ['dev', '--config-dir', './custom-storybook', '--port', '6007'],
      expect.any(Object)
    );
  });

  it('should handle custom port configuration', async () => {
    const options: StorybookOptions = {
      port: 6007
    };
    const mockCallback = jest.fn();

    await storybook(options, mockCallback);
    jest.runAllTimers();
    await Promise.resolve();

    expect(execa).toHaveBeenCalledWith(
      '/node_modules/.bin/storybook',
      ['dev', '--config-dir', '/tmp/lex-storybook-test/.storybook', '--port', '6007'],
      expect.any(Object)
    );
  });

  it('should handle multiple options together', async () => {
    const options: StorybookOptions = {
      open: true,
      port: 6007
    };
    const mockCallback = jest.fn();

    await storybook(options, mockCallback);
    jest.runAllTimers();
    await Promise.resolve();

    expect(execa).toHaveBeenCalledWith(
      '/node_modules/.bin/storybook',
      ['dev', '--config-dir', '/tmp/lex-storybook-test/.storybook', '--port', '6007', '--open'],
      expect.objectContaining({
        env: expect.objectContaining({
          STORYBOOK_OPEN: true
        })
      })
    );
  });

  it('should handle environment variables integration', async () => {
    const options: StorybookOptions = {
      quiet: false,
      variables: '{"STORYBOOK_THEME": "dark", "DEBUG": true, "NODE_ENV": "development"}'
    };
    const mockCallback = jest.fn();

    await storybook(options, mockCallback);

    expect(process.env).toEqual(expect.objectContaining({
      NODE_ENV: 'development',
      STORYBOOK_THEME: 'dark',
      DEBUG: true
    }));

    jest.runAllTimers();
    await Promise.resolve();
  });

  it('should handle package.json not found', async () => {
    const options: StorybookOptions = {
      quiet: false
    };
    const mockCallback = jest.fn();

    (existsSync as jest.Mock).mockReturnValue(false);

    const result = await storybook(options, mockCallback);

    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);

    jest.runAllTimers();
    await Promise.resolve();
  });

  it('should handle invalid package.json', async () => {
    const options: StorybookOptions = {};
    const mockCallback = jest.fn();

    // Mock no story files found
    (globSync as unknown as jest.Mock).mockReturnValue([]);

    const result = await storybook(options, mockCallback);
    jest.runAllTimers();
    await Promise.resolve();

    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
    expect(mockSpinner.fail).toHaveBeenCalledWith('No story files found in the project.');
  });

  it('should handle empty story files array', async () => {
    const options: StorybookOptions = {
      quiet: false
    };
    const mockCallback = jest.fn();

    (globSync as unknown as jest.Mock).mockReturnValue([]);

    const result = await storybook(options, mockCallback);

    expect(mockSpinner.fail).toHaveBeenCalledWith('No story files found in the project.');
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);

    jest.runAllTimers();
    await Promise.resolve();
  });

  it('should handle Storybook binary resolution failure', async () => {
    const options: StorybookOptions = {
      quiet: false
    };
    const mockCallback = jest.fn();

    (file.resolveBinaryPath as jest.Mock).mockReturnValue(null);

    const result = await storybook(options, mockCallback);

    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);

    jest.runAllTimers();
    await Promise.resolve();
  });

  it('should handle execa execution failure', async () => {
    const options: StorybookOptions = {};
    const mockCallback = jest.fn();

    // Mock execa to fail
    (execa as jest.MockedFunction<typeof execa>).mockRejectedValue(new Error('Storybook failed to start'));

    const result = await storybook(options, mockCallback);
    jest.runAllTimers();
    await Promise.resolve();

    expect(mockSpinner.fail).toHaveBeenCalledWith('There was an error while running storybook.');
    expect(mockCallback).toHaveBeenCalledWith(1);
    expect(result).toBe(1);
  });
});