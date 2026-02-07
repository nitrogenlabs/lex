// Mock implementation of LexConfig
const defaultConfigValues = {
  bundler: 'swc',
  useTypescript: false,
  useGraphQl: false,
  targetEnvironment: 'web',
  sourcePath: './src',
  outputPath: './lib'
};

const LexConfig = {
  config: defaultConfigValues,
  parseConfig: vi.fn(),
  checkTypescriptConfig: vi.fn(),
  checkCompileTypescriptConfig: vi.fn(),
  checkLintTypescriptConfig: vi.fn(),
  checkTestTypescriptConfig: vi.fn(),
  getLexDir: vi.fn(() => '/mock/lex/dir'),
  updateConfig: vi.fn((config) => ({...defaultConfigValues, ...config})),
  addConfigParams: vi.fn(),
  get useTypescript() {
    return this.config.useTypescript;
  },
  set useTypescript(value) {
    this.config.useTypescript = value;
  }
};

const getTypeScriptConfigPath = vi.fn((configName) => `/mock/lex/dir/${configName}`);

module.exports = {
  LexConfig,
  defaultConfigValues,
  getTypeScriptConfigPath
};