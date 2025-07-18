import {execa} from 'execa';

import {migrate} from './migrate.js';

jest.mock('execa');
jest.mock('../../utils/app.js', () => ({
  createSpinner: jest.fn(() => ({
    start: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn()
  })),
  getPackageJson: jest.fn(() => ({
    name: 'test-package',
    version: '1.0.0',
    dependencies: {},
    devDependencies: {}
  })),
  setPackageJson: jest.fn(),
  removeModules: jest.fn().mockResolvedValue(undefined),
  removeFiles: jest.fn().mockResolvedValue(undefined),
  removeConflictModules: jest.fn((modules) => modules)
}));
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js');
jest.mock('fs');
jest.mock('path');

describe('migrate integration', () => {
  let processExitSpy: jest.SpyInstance;

  beforeAll(() => {
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    processExitSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('should migrate successfully', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({stdout: '', stderr: '', exitCode: 0} as any);
    await migrate({});

    expect(execa).toHaveBeenCalled();
  });

  it('should handle migration errors', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockRejectedValueOnce(new Error('Install failed'));
    const result = await migrate({});

    expect(result).toBe(1);
  });
});