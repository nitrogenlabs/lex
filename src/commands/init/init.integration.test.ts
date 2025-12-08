import {execa} from 'execa';

import {init} from './init.js';

jest.mock('execa');
jest.mock('fs');
jest.mock('path');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js', () => ({
  createSpinner: jest.fn(() => ({
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn()
  })),
  copyFileSync: jest.fn(),
  copyFolderRecursiveSync: jest.fn(),
  getPackageJson: jest.fn(() => ({
    dependencies: {},
    devDependencies: {},
    name: 'test-package',
    version: '1.0.0'
  })),
  setPackageJson: jest.fn(),
  updateTemplateName: jest.fn()
}));
jest.mock('../../utils/log.js');
jest.mock('../../utils/file.js');

describe('init integration', () => {
  let consoleLogSpy: jest.SpyInstance;
  let chdirSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    chdirSpy = jest.spyOn(process, 'chdir').mockImplementation(() => undefined);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    chdirSpy.mockRestore();
    jest.restoreAllMocks();
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
    (execa as jest.MockedFunction<typeof execa>).mockRejectedValueOnce(new Error('Download failed'));
    const result = await init('invalid-app', 'invalid-package', {});

    expect(result).toBe(1);
  });
});