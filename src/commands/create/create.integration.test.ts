import {create} from './create.js';

vi.mock('execa');
vi.mock('fs', async () => ({
  existsSync: (path) => {
    if(typeof path === 'string' && (path.includes('TestStore') || path.includes('TestView') || path.includes('TestDataLayer'))) {
      return false;
    }
    return true;
  },
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(() => '{}'),
  renameSync: vi.fn(),
  writeFileSync: vi.fn()
}));
vi.mock('path', async () => ({
  resolve: vi.fn((...args) => args.join('/'))
}));
vi.mock('glob', async () => ({
  sync: vi.fn(() => [])
}));
vi.mock('../../create/changelog.js', async () => ({
  createChangelog: vi.fn().mockResolvedValue(0)
}));
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  createSpinner: vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn()
  })),
  copyFolderRecursiveSync: vi.fn(),
  removeFiles: vi.fn().mockResolvedValue(undefined),
  getFilenames: vi.fn(() => ({
    nameCaps: 'Test',
    templateExt: '.ts',
    templatePath: '/mock/template/path',
    templateReact: '.tsx'
  })),
  updateTemplateName: vi.fn()
}));
vi.mock('../../utils/file.js', async () => ({
  getDirName: vi.fn(() => '/mock/dir')
}));
vi.mock('../../utils/log.js');
vi.mock('../../LexConfig.js', async () => ({
  LexConfig: {
    checkTypescriptConfig: vi.fn(),
    config: {
      outputPath: './lib',
      sourcePath: './src',
      useTypescript: false
    },
    parseConfig: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('create integration', () => {
  let consoleLogSpy: SpyInstance;

  beforeAll(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('should create changelog', async () => {
    const result = await create('changelog', {});

    expect(result).toBe(0);
  });

  it('should create store', async () => {
    const result = await create('store', {outputName: 'test-store'});

    expect(result).toBe(0);
  });

  it('should create view', async () => {
    const result = await create('view', {outputName: 'test-view'});

    expect(result).toBe(0);
  });

  it('should create tsconfig', async () => {
    const result = await create('tsconfig', {});

    expect(result).toBe(0);
  });

  it('should create vscode config', async () => {
    const result = await create('vscode', {});

    expect(result).toBe(0);
  });

  it('should create datalayer', async () => {
    const result = await create('datalayer', {outputName: 'test-datalayer'});

    expect(result).toBe(0);
  });

  it('should handle invalid type', async () => {
    const result = await create('invalid' as any, {});

    expect(result).toBe(0);
  });
});
