import {create} from './create.js';

vi.mock('execa');
vi.mock('fs', async () => ({
  existsSync: vi.fn(() => true),
  readFileSync: vi.fn(() => '{}'),
  renameSync: vi.fn(),
  writeFileSync: vi.fn()
}));
vi.mock('glob', async () => ({
  sync: vi.fn(() => [])
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

describe('create cli', () => {
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

  it('should create project with default options', async () => {
    const result = await create('app', {});

    expect(result).toBe(0);
  });

  it('should create project with quiet option', async () => {
    const result = await create('app', {quiet: true});

    expect(result).toBe(0);
  });
});