import {config} from './config.js';

vi.mock('fs', async () => ({
  writeFileSync: vi.fn()
}));
vi.mock('glob', async () => ({
  sync: vi.fn(() => [])
}));
vi.mock('path', async () => ({
  relative: vi.fn(() => 'relative/path')
}));
vi.mock('../../LexConfig.js', async () => ({
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
      vitest: {},
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
    parseConfig: vi.fn().mockResolvedValue(undefined)
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
vi.mock('../../utils/log.js');

describe('config options', () => {
  let consoleLogSpy;

  beforeAll(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    vi.restoreAllMocks();
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
