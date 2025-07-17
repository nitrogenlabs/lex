import {execa} from 'execa';

import {compile} from './compile.js';

jest.mock('execa');
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn()
  })),
  checkLinkedModules: jest.fn(),
  copyConfiguredFiles: jest.fn().mockResolvedValue(undefined),
  copyFiles: jest.fn().mockResolvedValue(undefined),
  getFilesByExt: jest.fn().mockReturnValue([]),
  removeFiles: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../../utils/file.js', () => ({
  getDirName: jest.fn(() => '/mock/dir'),
  resolveBinaryPath: jest.fn((binary) => `/mock/path/to/${binary}`)
}));
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js', () => ({
  LexConfig: {
    parseConfig: jest.fn().mockResolvedValue(undefined),
    config: {
      outputFullPath: '/mock/output',
      sourceFullPath: '/mock/source',
      useTypescript: true,
      esbuild: {}
    },
    checkCompileTypescriptConfig: jest.fn()
  },
  getTypeScriptConfigPath: jest.fn(() => 'tsconfig.build.json')
}));
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  lstatSync: jest.fn(() => ({isDirectory: () => false})),
  readdirSync: jest.fn(() => [])
}));
jest.mock('glob', () => ({
  sync: jest.fn(() => [])
}));

describe('compile cli', () => {
  let consoleLogSpy;
  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterAll(() => {
    consoleLogSpy.mockRestore();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should compile with default options', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({
      stdout: '',
      stderr: '',
      exitCode: 0
    } as any);

    await compile({});

    expect(execa).toHaveBeenCalledWith(
      expect.stringContaining('tsc'),
      ['-p', 'tsconfig.build.json'],
      expect.any(Object)
    );
  });

  it('should compile with custom config', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({
      stdout: '',
      stderr: '',
      exitCode: 0
    } as any);

    await compile({config: 'tsconfig.custom.json'});

    expect(execa).toHaveBeenCalledWith(
      expect.stringContaining('tsc'),
      ['-p', 'tsconfig.custom.json'],
      expect.any(Object)
    );
  });

  it('should compile with watch mode', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({
      stdout: '',
      stderr: '',
      exitCode: 0
    } as any);

    await compile({watch: true});

    expect(execa).toHaveBeenCalledWith(
      expect.stringContaining('esbuild'),
      expect.arrayContaining(['--watch']),
      expect.any(Object)
    );
  });

  it('should handle TypeScript compilation errors', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockRejectedValueOnce(new Error('TypeScript compilation failed'));

    const result = await compile({});

    expect(result).toBe(1);
  });

  it('should handle ESBuild compilation errors', async () => {
    (execa as jest.MockedFunction<typeof execa>)
      .mockResolvedValueOnce({stdout: '', stderr: '', exitCode: 0} as any) // tsc success
      .mockRejectedValueOnce(new Error('ESBuild compilation failed')); // esbuild failure

    const result = await compile({});

    expect(result).toBe(1);
  });
});
