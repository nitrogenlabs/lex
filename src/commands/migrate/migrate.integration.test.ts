import {execa} from 'execa';

import {migrate} from './migrate.js';

vi.mock('execa');
vi.mock('../../utils/app.js', async () => ({
  createSpinner: vi.fn(() => ({
    start: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn()
  })),
  copyFileSync: vi.fn(),
  getPackageJson: vi.fn(() => ({
    dependencies: {},
    devDependencies: {},
    name: 'test-package',
    version: '1.0.0'
  })),
  removeConflictModules: vi.fn((modules) => modules),
  removeFiles: vi.fn().mockResolvedValue(undefined),
  removeModules: vi.fn().mockResolvedValue(undefined),
  setPackageJson: vi.fn()
}));
vi.mock('../../utils/log.js');
vi.mock('../../LexConfig.js');
vi.mock('fs');
vi.mock('path');

describe('migrate integration', () => {
  let processExitSpy: SpyInstance;

  beforeAll(() => {
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    processExitSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('should migrate successfully', async () => {
    (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
    await migrate({});

    expect(execa).toHaveBeenCalled();
  });

  it('should handle migration errors', async () => {
    (execa as MockedFunction<typeof execa>).mockRejectedValueOnce(new Error('Install failed'));
    const result = await migrate({});

    expect(result).toBe(1);
  });
});