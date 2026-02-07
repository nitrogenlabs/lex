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
      outputPath: './lib',
      sourcePath: './src',
      useTypescript: true
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

describe('config integration', () => {
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

  it('should generate app config', async () => {
    const result = await config('app', {});

    expect(result).toBe(0);
  });


  it('should handle invalid config type', async () => {
    const result = await config('invalid', {});

    expect(result).toBe(1);
  });

  it('should save config to json file', async () => {
    const {writeFileSync} = require('fs');
    const result = await config('app', {json: 'test-config.json'});

    expect(result).toBe(0);
    expect(writeFileSync).toHaveBeenCalledWith('test-config.json', expect.any(String));
  });

  it('should handle quiet mode', async () => {
    const result = await config('app', {quiet: true});

    expect(result).toBe(0);
  });
});