import {execa} from 'execa';

import {init} from './init.js';

jest.mock('execa');
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => '{}'),
  renameSync: jest.fn(),
  unlinkSync: jest.fn(),
  writeFileSync: jest.fn()
}));
jest.mock('glob', () => ({
  sync: jest.fn()
}));
jest.mock('path', () => ({
  dirname: jest.fn(() => '/mock/dir'),
  resolve: jest.fn((...args) => args.join('/'))
}));
jest.mock('../../LexConfig.js', () => ({
  LexConfig: {
    config: {
      packageManager: 'npm',
      useTypescript: false
    },
    parseConfig: jest.fn().mockResolvedValue(undefined)
  }
}));
jest.mock('../../utils/app.js', () => ({
  createSpinner: jest.fn(() => ({
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn()
  })),
  getPackageJson: jest.fn(() => ({
    description: 'Test app',
    name: 'test-app',
    version: '0.1.0'
  })),
  setPackageJson: jest.fn()
}));
jest.mock('../../utils/log.js');
jest.mock('../../utils/file.js', () => ({
  getDirName: jest.fn(() => '/mock/dir')
}));

describe('init options', () => {
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

  it('should handle default options', async () => {
    const mockCallback = jest.fn();
    const result = await init('test-app', '@test/package', {}, mockCallback);

    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should handle typescript option', async () => {
    const mockCallback = jest.fn();
    const result = await init('test-app', '', {typescript: true}, mockCallback);

    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should handle install option', async () => {
    const mockCallback = jest.fn();
    const result = await init('test-app', '@test/package', {install: true}, mockCallback);

    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should handle packageManager option', async () => {
    const mockCallback = jest.fn();
    const result = await init('test-app', '@test/package', {packageManager: 'yarn'}, mockCallback);

    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should handle quiet option', async () => {
    const mockCallback = jest.fn();
    const result = await init('test-app', '@test/package', {quiet: true}, mockCallback);

    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should handle cliName option', async () => {
    const mockCallback = jest.fn();
    const result = await init('test-app', '@test/package', {cliName: 'CustomCLI'}, mockCallback);

    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });
});