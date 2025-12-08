import {execa} from 'execa';

import {compile} from './compile.js';

jest.mock('execa');
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  checkLinkedModules: jest.fn(),
  copyConfiguredFiles: jest.fn().mockResolvedValue(undefined),
  createSpinner: jest.fn(() => ({
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn()
  })),
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
    checkCompileTypescriptConfig: jest.fn(),
    config: {
      outputFullPath: '/mock/output',
      sourceFullPath: '/mock/source',
      useTypescript: true
    },
    getTypeScriptDeclarationFlags: jest.fn(() => [
      '--emitDeclarationOnly',
      '--declaration',
      '--declarationMap',
      '--outDir', './lib',
      '--rootDir', './src',
      '--skipLibCheck',
      '--esModuleInterop',
      '--allowSyntheticDefaultImports',
      '--module', 'NodeNext',
      '--moduleResolution', 'NodeNext',
      '--target', 'ESNext',
      '--jsx', 'react-jsx',
      '--isolatedModules',
      '--resolveJsonModule',
      '--allowJs'
    ]),
    parseConfig: jest.fn().mockResolvedValue(undefined)
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

describe('compile options', () => {
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
      exitCode: 0,
      stderr: '',
      stdout: ''
    } as any);

    const result = await compile({});

    expect(result).toBe(0);
    expect(execa).toHaveBeenCalled();
  });

  it('should compile with quiet mode', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({
      exitCode: 0,
      stderr: '',
      stdout: ''
    } as any);

    const result = await compile({quiet: true});

    expect(result).toBe(0);
  });

  it('should compile with custom output path', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({
      exitCode: 0,
      stderr: '',
      stdout: ''
    } as any);

    const result = await compile({outputPath: '/custom/output'});

    expect(result).toBe(0);
  });

  it('should compile with remove option', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({
      exitCode: 0,
      stderr: '',
      stdout: ''
    } as any);

    const result = await compile({remove: true});

    expect(result).toBe(0);
  });
});
