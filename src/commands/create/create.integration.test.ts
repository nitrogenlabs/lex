import {create} from './create.js';

jest.mock('execa');
jest.mock('fs', () => ({
  existsSync: (path) => {
    if(typeof path === 'string' && (path.includes('TestStore') || path.includes('TestView'))) {
      return false;
    }
    return true;
  },
  readFileSync: jest.fn(() => '{}'),
  writeFileSync: jest.fn(),
  renameSync: jest.fn()
}));
jest.mock('path', () => ({
  resolve: jest.fn((...args) => args.join('/'))
}));
jest.mock('glob', () => ({
  sync: jest.fn(() => [])
}));
jest.mock('../../create/changelog.js', () => ({
  createChangelog: jest.fn().mockResolvedValue(0)
}));
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    start: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn()
  })),
  removeFiles: jest.fn().mockResolvedValue(undefined),
  copyFolderRecursiveSync: jest.fn(),
  getFilenames: jest.fn(() => ({
    nameCaps: 'Test',
    templateExt: '.ts',
    templatePath: '/mock/template/path',
    templateReact: '.tsx'
  })),
  updateTemplateName: jest.fn()
}));
jest.mock('../../utils/file.js', () => ({
  getDirName: jest.fn(() => '/mock/dir')
}));
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js', () => ({
  LexConfig: {
    parseConfig: jest.fn().mockResolvedValue(undefined),
    config: {
      useTypescript: false,
      sourcePath: './src',
      outputPath: './dist'
    },
    checkTypescriptConfig: jest.fn()
  }
}));

describe('create integration', () => {
  let consoleLogSpy: jest.SpyInstance;

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

  it('should handle invalid type', async () => {
    const result = await create('invalid' as any, {});

    expect(result).toBe(0);
  });
});
