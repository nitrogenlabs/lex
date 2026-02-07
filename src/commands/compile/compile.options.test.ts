import {execa} from 'execa';

import {compile} from './compile.js';

vi.mock('execa');
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  checkLinkedModules: vi.fn(),
  copyConfiguredFiles: vi.fn().mockResolvedValue(undefined),
  createSpinner: vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn()
  })),
  copyFiles: vi.fn().mockResolvedValue(undefined),
  getFilesByExt: vi.fn().mockReturnValue([]),
  removeFiles: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('../../utils/file.js', async () => ({
  getDirName: vi.fn(() => '/mock/dir'),
  resolveBinaryPath: vi.fn((binary) => `/mock/path/to/${binary}`)
}));
vi.mock('../../utils/log.js');
vi.mock('../../LexConfig.js', async () => ({
  LexConfig: {
    checkCompileTypescriptConfig: vi.fn(),
    config: {
      outputFullPath: '/mock/output',
      sourceFullPath: '/mock/source',
      useTypescript: true
    },
    getTypeScriptDeclarationFlags: vi.fn(() => [
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
    parseConfig: vi.fn().mockResolvedValue(undefined)
  },
  getTypeScriptConfigPath: vi.fn(() => 'tsconfig.build.json')
}));
vi.mock('fs', async () => ({
  existsSync: vi.fn(() => true),
  lstatSync: vi.fn(() => ({isDirectory: () => false})),
  readdirSync: vi.fn(() => [])
}));
vi.mock('glob', async () => ({
  sync: vi.fn(() => [])
}));

describe('compile options', () => {
  let consoleLogSpy;

  beforeAll(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should compile with default options', async () => {
    (execa as MockedFunction<typeof execa>).mockResolvedValue({
      exitCode: 0,
      stderr: '',
      stdout: ''
    } as any);

    const result = await compile({});

    expect(result).toBe(0);
    expect(execa).toHaveBeenCalled();
  });

  it('should compile with quiet mode', async () => {
    (execa as MockedFunction<typeof execa>).mockResolvedValue({
      exitCode: 0,
      stderr: '',
      stdout: ''
    } as any);

    const result = await compile({quiet: true});

    expect(result).toBe(0);
  });

  it('should compile with custom output path', async () => {
    (execa as MockedFunction<typeof execa>).mockResolvedValue({
      exitCode: 0,
      stderr: '',
      stdout: ''
    } as any);

    const result = await compile({outputPath: '/custom/output'});

    expect(result).toBe(0);
  });

  it('should compile with remove option', async () => {
    (execa as MockedFunction<typeof execa>).mockResolvedValue({
      exitCode: 0,
      stderr: '',
      stdout: ''
    } as any);

    const result = await compile({remove: true});

    expect(result).toBe(0);
  });
});
