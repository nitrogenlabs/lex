import {config} from './config.js';

jest.mock('fs', () => ({
  writeFileSync: jest.fn()
}));
jest.mock('glob', () => ({
  sync: jest.fn(() => [])
}));
jest.mock('path', () => ({
  relative: jest.fn(() => 'relative/path')
}));
jest.mock('../../LexConfig.js', () => ({
  LexConfig: {
    parseConfig: jest.fn().mockResolvedValue(undefined),
    config: {
      useTypescript: true,
      sourcePath: './src',
      outputPath: './dist',
      targetEnvironment: 'web',
      preset: 'web',
      packageManager: 'npm',
      ai: {
        provider: 'none',
        model: 'gpt-4o',
        maxTokens: 4000,
        temperature: 0.1
      },
      esbuild: {
        minify: true,
        treeShaking: true,
        drop: [],
        pure: [],
        legalComments: 'none',
        splitting: true,
        metafile: false,
        sourcemap: false
      },
      webpack: {},
      jest: {},
      outputHash: false,
      useGraphQl: false,
      configFiles: [],
      copyFiles: [],
      entryHTML: 'index.html',
      entryJs: 'index.js',
      env: null
    }
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
jest.mock('../../utils/log.js');

describe('config options', () => {
  let consoleLogSpy;
  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('should handle default options', async () => {
    const result = await config('app', {});

    expect(result).toBe(0);
  });

  it('should handle quiet option', async () => {
    const result = await config('app', {quiet: true});

    expect(result).toBe(0);
  });

  it('should handle json option', async () => {
    const {writeFileSync} = require('fs');
    const result = await config('app', {json: 'config.json'});

    expect(result).toBe(0);
    expect(writeFileSync).toHaveBeenCalledWith('config.json', expect.any(String));
  });

  it('should handle cliName option', async () => {
    const result = await config('app', {cliName: 'CustomCLI'});

    expect(result).toBe(0);
  });
});