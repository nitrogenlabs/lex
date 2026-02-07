import {execa} from 'execa';

import {init} from './init.js';

vi.mock('execa');
vi.mock('fs', async () => ({
  existsSync: vi.fn(() => true),
  readFileSync: vi.fn(() => '{}'),
  renameSync: vi.fn(),
  unlinkSync: vi.fn(),
  writeFileSync: vi.fn()
}));
vi.mock('glob', async () => ({
  sync: vi.fn()
}));
vi.mock('path', async () => ({
  dirname: vi.fn(() => '/mock/dir'),
  resolve: vi.fn((...args) => args.join('/'))
}));
vi.mock('../../LexConfig.js', async () => ({
  LexConfig: {
    config: {
      packageManager: 'npm',
      useTypescript: false
    },
    parseConfig: vi.fn().mockResolvedValue(undefined)
  }
}));
vi.mock('../../utils/app.js', async () => ({
  createSpinner: vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn()
  })),
  getPackageJson: vi.fn(() => ({
    description: 'Test app',
    name: 'test-app',
    version: '0.1.0'
  })),
  setPackageJson: vi.fn()
}));
vi.mock('../../utils/log.js');
vi.mock('../../utils/file.js', async () => ({
  getDirName: vi.fn(() => '/mock/dir')
}));

describe('init cli', () => {
  let consoleLogSpy: SpyInstance;
  let chdirSpy: SpyInstance;

  beforeAll(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    chdirSpy = vi.spyOn(process, 'chdir').mockImplementation(() => undefined);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    chdirSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('should initialize project with default options', async () => {
    const mockCallback = vi.fn();
    const result = await init('appName', 'packageName', {}, mockCallback);

    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should initialize project with quiet option', async () => {
    const mockCallback = vi.fn();
    const result = await init('appName', 'packageName', {quiet: true}, mockCallback);

    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });
});