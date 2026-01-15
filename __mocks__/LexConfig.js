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
  parseConfig: jest.fn(),
  checkTypescriptConfig: jest.fn(),
  checkCompileTypescriptConfig: jest.fn(),
  checkLintTypescriptConfig: jest.fn(),
  checkTestTypescriptConfig: jest.fn(),
  getLexDir: jest.fn(() => '/mock/lex/dir'),
  updateConfig: jest.fn((config) => ({...defaultConfigValues, ...config})),
  addConfigParams: jest.fn(),
  get useTypescript() {
    return this.config.useTypescript;
  },
  set useTypescript(value) {
    this.config.useTypescript = value;
  }
};

const getTypeScriptConfigPath = jest.fn((configName) => `/mock/lex/dir/${configName}`);

module.exports = {
  LexConfig,
  defaultConfigValues,
  getTypeScriptConfigPath
};