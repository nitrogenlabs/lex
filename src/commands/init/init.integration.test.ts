import {execa} from 'execa';

import {init} from './init.js';

vi.mock('execa');
vi.mock('fs');
vi.mock('path');
vi.mock('../../LexConfig.js');
vi.mock('../../utils/app.js', async () => ({
  createSpinner: vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn()
  })),
  copyFileSync: vi.fn(),
  copyFolderRecursiveSync: vi.fn(),
  getPackageJson: vi.fn(() => ({
    dependencies: {},
    devDependencies: {},
    name: 'test-package',
    version: '1.0.0'
  })),
  setPackageJson: vi.fn(),
  updateTemplateName: vi.fn()
}));
vi.mock('../../utils/log.js');
vi.mock('../../utils/file.js');

describe('init integration', () => {
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

  it('should initialize project successfully', async () => {
    const result = await init('test-app', '@test/package', {});

    expect(result).toBe(0);
  });

  it('should initialize with typescript template', async () => {
    const result = await init('test-app', '', {typescript: true});

    expect(result).toBe(0);
  });

  it('should initialize with flow template', async () => {
    const result = await init('test-app', '', {typescript: false});

    expect(result).toBe(0);
  });

  it('should install dependencies when requested', async () => {
    const result = await init('test-app', '@test/package', {install: true});

    expect(result).toBe(0);
  });

  it('should handle initialization errors', async () => {
    (execa as MockedFunction<typeof execa>).mockRejectedValueOnce(new Error('Download failed'));
    const result = await init('invalid-app', 'invalid-package', {});

    expect(result).toBe(1);
  });
});