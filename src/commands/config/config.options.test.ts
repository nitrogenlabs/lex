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
    config: {
      ai: {
        maxTokens: 4000,
        model: 'gpt-4o',
        provider: 'none',
        temperature: 0.1
      },
      configFiles: [],
      copyFiles: [],
      entryHTML: 'index.html',
      entryJs: 'index.js',
      env: null,
      jest: {},
      outputHash: false,
      outputPath: './lib',
      packageManager: 'npm',
      preset: 'web',
      sourcePath: './src',
      targetEnvironment: 'web',
      useGraphQl: false,
      useTypescript: true,
      webpack: {}
      // SWC configuration is handled automatically with optimal defaults
    },
    parseConfig: jest.fn().mockResolvedValue(undefined)
  }
}));
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn()
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