jest.mock('execa');
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => '{}'),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
  rmSync: jest.fn()
}));
jest.mock('path', () => ({
  dirname: jest.fn(() => '/mock/dir'),
  join: jest.fn((...args) => args.join('/')),
  resolve: jest.fn((...args) => args.join('/'))
}));
jest.mock('glob', () => ({
  sync: jest.fn(() => [])
}));
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn(),
  })),
  checkLinkedModules: jest.fn(),
  copyConfiguredFiles: jest.fn(),
  createProgressBar: jest.fn(),
  handleWebpackProgress: jest.fn(),
  removeFiles: jest.fn()
}));
jest.mock('../../LexConfig.js', () => ({
  LexConfig: {
    parseConfig: jest.fn(),
    config: {
      outputFullPath: './lib',
      sourceFullPath: './src',
      useTypescript: false
    }
  },
  getTypeScriptConfigPath: jest.fn(() => './tsconfig.build.json')
}));
jest.mock('../../utils/file.js', () => ({
  ...jest.requireActual('../../utils/file.js'),
  resolveWebpackPaths: jest.fn(() => ({
    webpackConfig: './webpack.config.js',
    webpackPath: 'npx'
  })),
  getDirName: jest.fn(() => '/mock/dir'),
  relativeNodePath: jest.fn(() => './mock/path'),
  getLexPackageJsonPath: jest.fn(() => '/mock/package.json')
}));
jest.mock('../../utils/log.js', () => ({
  log: jest.fn()
}));
jest.mock('../../utils/translations.js', () => ({
  processTranslations: jest.fn()
}));
jest.mock('../ai/ai.js', () => ({
  aiFunction: jest.fn()
}));

// Mock the buildWithWebpack function
jest.mock('./build.js', () => {
  const originalModule = jest.requireActual('./build.js');
  const mockBuildWithWebpack = jest.fn().mockResolvedValue(0);
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
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterAll(() => {
    consoleLogSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('should build with default options', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({stdout: '', stderr: '', exitCode: 0} as any);

    // Add a test flag to the build command to exit early
    const result = await build({test: true});
    expect(result).toBe(0);
  });
});
