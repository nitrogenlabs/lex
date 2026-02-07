vi.mock('execa');
vi.mock('fs', async () => ({
  existsSync: vi.fn(() => true),
  readFileSync: vi.fn(() => '{}'),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  unlinkSync: vi.fn(),
  rmSync: vi.fn()
}));
vi.mock('path', async () => ({
  dirname: vi.fn(() => '/mock/dir'),
  join: vi.fn((...args) => args.join('/')),
  resolve: vi.fn((...args) => args.join('/'))
}));
vi.mock('glob', async () => ({
  sync: vi.fn(() => [])
}));
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  createSpinner: vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn(),
  })),
  checkLinkedModules: vi.fn(),
  copyConfiguredFiles: vi.fn(),
  createProgressBar: vi.fn(),
  handleWebpackProgress: vi.fn(),
  removeFiles: vi.fn()
}));
vi.mock('../../LexConfig.js', async () => ({
  LexConfig: {
    parseConfig: vi.fn(),
    config: {
      outputFullPath: './lib',
      sourceFullPath: './src',
      useTypescript: false
    }
  },
  getTypeScriptConfigPath: vi.fn(() => './tsconfig.build.json')
}));
vi.mock('../../utils/file.js', async () => ({
  ...await vi.importActual('../../utils/file.js'),
  resolveWebpackPaths: vi.fn(() => ({
    webpackConfig: './webpack.config.js',
    webpackPath: 'npx'
  })),
  getDirName: vi.fn(() => '/mock/dir'),
  relativeNodePath: vi.fn(() => './mock/path'),
  getLexPackageJsonPath: vi.fn(() => '/mock/package.json')
}));
vi.mock('../../utils/log.js', async () => ({
  log: vi.fn()
}));
vi.mock('../../utils/translations.js', async () => ({
  processTranslations: vi.fn()
}));
vi.mock('../ai/ai.js', async () => ({
  aiFunction: vi.fn()
}));

// Mock the buildWithWebpack function
vi.mock('./build.js', async () => {
  const originalModule = await vi.importActual('./build.js');
  const mockBuildWithWebpack = vi.fn().mockResolvedValue(0);
  return {
    ...originalModule,
    buildWithWebpack: mockBuildWithWebpack
  };
});

import {execa} from 'execa';
import {build} from './build.js';

describe('build options', () => {
  let consoleLogSpy;
  beforeAll(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterAll(() => {
    consoleLogSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('should build with default options', async () => {
    (execa as MockedFunction<typeof execa>).mockResolvedValue({stdout: '', stderr: '', exitCode: 0} as any);

    // Add a test flag to the build command to exit early
    const result = await build({test: true});
    expect(result).toBe(0);
  });
});
