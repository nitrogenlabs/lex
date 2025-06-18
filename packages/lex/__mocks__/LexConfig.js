// Mock implementation of LexConfig
const defaultConfigValues = {
  bundler: 'webpack',
  useTypescript: false,
  useGraphQl: false,
  targetEnvironment: 'web',
  sourcePath: './src',
  outputPath: './dist'
};

const LexConfig = {
  config: defaultConfigValues,
  parseConfig: jest.fn(),
  checkTypescriptConfig: jest.fn()
};

module.exports = {
  LexConfig,
  defaultConfigValues
};