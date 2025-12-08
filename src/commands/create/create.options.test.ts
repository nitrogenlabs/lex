import {create} from './create.js';

jest.mock('execa');
jest.mock('fs', () => ({
  existsSync: (path) => {
    if(typeof path === 'string' && path.includes('TestStore')) {
      return false;
    }
    return true;
  },
  readFileSync: jest.fn(() => '{}'),
  renameSync: jest.fn(),
  writeFileSync: jest.fn()
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
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn()
  })),
  copyFolderRecursiveSync: jest.fn(),
  removeFiles: jest.fn().mockResolvedValue(undefined),
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
    checkTypescriptConfig: jest.fn(),
    config: {
      outputPath: './lib',
      sourcePath: './src',
      useTypescript: false
    },
    parseConfig: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('create options', () => {
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

  it('should handle default options', async () => {
    const result = await create('changelog', {});

    expect(result).toBe(0);
  });

  it('should handle quiet option', async () => {
    const result = await create('changelog', {quiet: true});

    expect(result).toBe(0);
  });

  it('should handle outputFile option', async () => {
    const result = await create('changelog', {outputFile: 'CHANGELOG.md'});

    expect(result).toBe(0);
  });

  it('should handle outputName option', async () => {
    const result = await create('store', {outputName: 'test-store'});

    expect(result).toBe(0);
  });

  it('should handle cliName option', async () => {
    const result = await create('changelog', {cliName: 'CustomCLI'});

    expect(result).toBe(0);
  });
});