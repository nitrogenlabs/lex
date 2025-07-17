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

describe('compile integration', () => {
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

  it('should compile successfully', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({
      stdout: '',
      stderr: '',
      exitCode: 0
    } as any);

    const result = await compile({});

    expect(result).toBe(0);
    expect(execa).toHaveBeenCalledWith(
      expect.stringContaining('tsc'),
      ['-p', 'tsconfig.build.json'],
      expect.any(Object)
    );
  });

  it('should handle compilation errors', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockRejectedValueOnce(new Error('Compilation failed'));

    const result = await compile({});

    expect(result).toBe(1);
  });

  it('should handle missing TypeScript binary', async () => {
    const {resolveBinaryPath} = require('../../utils/file.js');
    resolveBinaryPath.mockReturnValueOnce(null); // tsc not found

    const result = await compile({});

    expect(result).toBe(1);
  });

  it('should handle missing ESBuild binary', async () => {
    const {resolveBinaryPath} = require('../../utils/file.js');
    resolveBinaryPath
      .mockReturnValueOnce('/mock/path/to/tsc') // tsc found
      .mockReturnValueOnce(null); // esbuild not found

    const result = await compile({});

    expect(result).toBe(1);
  });
});