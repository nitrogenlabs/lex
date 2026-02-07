import {execa} from 'execa';
import {existsSync, readFileSync} from 'fs';
import {sync as globSync} from 'glob';

import {storybook, StorybookOptions} from './storybook.js';
import * as app from '../../utils/app.js';
import * as file from '../../utils/file.js';

vi.mock('execa');
vi.mock('fs', async () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn()
}));
vi.mock('glob', async () => ({
  sync: vi.fn()
}));
vi.mock('../../LexConfig.js', async () => ({
  LexConfig: {
    checkTestTypescriptConfig: vi.fn(),
    checkTypescriptConfig: vi.fn(),
    config: {
      useTypescript: true
    },
    getLexDir: vi.fn(() => '/mock/lex/dir'),
    parseConfig: vi.fn().mockResolvedValue(undefined)
  },
  getTypeScriptConfigPath: vi.fn(() => 'tsconfig.test.json')
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
let pathResolveSpy: SpyInstance;

beforeAll(() => {
  pathResolveSpy = vi.spyOn(require('path'), 'resolve').mockImplementation((...args: string[]) => args.join('/'));
  consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  pathResolveSpy.mockRestore();
  consoleLogSpy.mockRestore();
  vi.restoreAllMocks();
});

describe('storybook.integration tests', () => {
  let mockSpinner: {
    start: Mock;
    succeed: Mock;
    fail: Mock;
  };
  let tempDir: string;

  beforeEach(() => {
    vi.clearAllMocks();

    tempDir = '/tmp/lex-storybook-test';
    vi.spyOn(process, 'cwd').mockReturnValue(tempDir);

    process.env = {
      NODE_ENV: 'test'
    };

    mockSpinner = {
      fail: vi.fn(),
      start: vi.fn(),
      succeed: vi.fn()
    };
    (app.createSpinner as Mock).mockReturnValue(mockSpinner);

    // Default mocks that make the code succeed
    (existsSync as Mock).mockImplementation((path: any) => {
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
    (readFileSync as Mock).mockReturnValue('{"dependencies": {"@storybook/react": "^7.0.0"}}');
    (file.resolveBinaryPath as Mock).mockReturnValue('/node_modules/.bin/storybook');
    (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
    (globSync as unknown as Mock).mockReturnValue(['src/Component.stories.ts', 'src/Button.stories.tsx']);
  });

  afterAll(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should find story files in multiple locations', async () => {
    const options: StorybookOptions = {
      quiet: false
    };
    const mockCallback = vi.fn();

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

    vi.runAllTimers();
    await Promise.resolve();
  });

  it('should check for Storybook installation in package.json', async () => {
    const options: StorybookOptions = {};
    const mockCallback = vi.fn();

    (globSync as unknown as Mock).mockReturnValue([]);

    await storybook(options, mockCallback);
    vi.runAllTimers();
    await Promise.resolve();

    expect(mockSpinner.fail).toHaveBeenCalledWith('No story files found in the project.');
  });

  it('should handle different Storybook framework installations', async () => {
    const options: StorybookOptions = {};
    const mockCallback = vi.fn();

    (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);

    await storybook(options, mockCallback);

    expect(mockCallback).toHaveBeenCalledWith(0);

    mockCallback.mockClear();
    vi.runAllTimers();
    await Promise.resolve();
  });

  it('should handle static build with output directory', async () => {
    const options: StorybookOptions = {
      static: true
    };
    const mockCallback = vi.fn();

    (file.resolveBinaryPath as Mock).mockReturnValue('/node_modules/.bin/storybook');

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
    const mockCallback = vi.fn();

    // Mock the custom config directory to exist
    (existsSync as Mock).mockImplementation((path: any) => {
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
    vi.runAllTimers();
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
    const mockCallback = vi.fn();

    await storybook(options, mockCallback);
    vi.runAllTimers();
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
    const mockCallback = vi.fn();

    await storybook(options, mockCallback);
    vi.runAllTimers();
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
    const mockCallback = vi.fn();

    await storybook(options, mockCallback);

    expect(process.env).toEqual(expect.objectContaining({
      NODE_ENV: 'development',
      STORYBOOK_THEME: 'dark',
      DEBUG: true
    }));

    vi.runAllTimers();
    await Promise.resolve();
  });

  it('should handle package.json not found', async () => {
    const options: StorybookOptions = {
      quiet: false
    };
    const mockCallback = vi.fn();

    (existsSync as Mock).mockReturnValue(false);

    const result = await storybook(options, mockCallback);

    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);

    vi.runAllTimers();
    await Promise.resolve();
  });

  it('should handle invalid package.json', async () => {
    const options: StorybookOptions = {};
    const mockCallback = vi.fn();

    // Mock no story files found
    (globSync as unknown as Mock).mockReturnValue([]);

    const result = await storybook(options, mockCallback);
    vi.runAllTimers();
    await Promise.resolve();

    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
    expect(mockSpinner.fail).toHaveBeenCalledWith('No story files found in the project.');
  });

  it('should handle empty story files array', async () => {
    const options: StorybookOptions = {
      quiet: false
    };
    const mockCallback = vi.fn();

    (globSync as unknown as Mock).mockReturnValue([]);

    const result = await storybook(options, mockCallback);

    expect(mockSpinner.fail).toHaveBeenCalledWith('No story files found in the project.');
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);

    vi.runAllTimers();
    await Promise.resolve();
  });

  it('should handle Storybook binary resolution failure', async () => {
    const options: StorybookOptions = {
      quiet: false
    };
    const mockCallback = vi.fn();

    (file.resolveBinaryPath as Mock).mockReturnValue(null);

    const result = await storybook(options, mockCallback);

    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);

    vi.runAllTimers();
    await Promise.resolve();
  });

  it('should handle execa execution failure', async () => {
    const options: StorybookOptions = {};
    const mockCallback = vi.fn();

    // Mock execa to fail
    (execa as MockedFunction<typeof execa>).mockRejectedValue(new Error('Storybook failed to start'));

    const result = await storybook(options, mockCallback);
    vi.runAllTimers();
    await Promise.resolve();

    expect(mockSpinner.fail).toHaveBeenCalledWith('There was an error while running storybook.');
    expect(mockCallback).toHaveBeenCalledWith(1);
    expect(result).toBe(1);
  });
});