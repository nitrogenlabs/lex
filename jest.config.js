const path = require('path');

const {relativeFilePath} = require('./dist/utils');

const cwd = process.cwd();
const {sourceFullPath} = JSON.parse(process.env.LEX_CONFIG || '{}');

// Polyfill path
const nodePath = path.resolve(__dirname, './node_modules');
const babelPolyfillPath = relativeFilePath('@babel/polyfill/dist/polyfill.js', nodePath);

module.exports = {
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coveragePathIgnorePatterns: ['/node_modules/'],
  coverageReporters: ['html', 'text'],
  moduleDirectories: [
    'node_modules'
  ],
  moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
  moduleNameMapper: {
    '\\.(css|jpg|png|svg|txt)$': path.resolve(__dirname, './dist/emptyModule')
  },
  modulePaths: [
    `${cwd}/node_modules`,
    nodePath,
    sourceFullPath
  ],
  resolver: path.resolve(__dirname, './dist/resolver.js'),
  rootDir: cwd,
  setupFiles: [babelPolyfillPath],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '/node_modules/',
    `${nodePath}/`
  ],
  testRegex: '(/__tests__/.*|\\.(test|spec))\\.(js|ts|tsx)?$',
  testURL: 'http://localhost',
  transform: {'\\.(js|ts|tsx)$': path.resolve(__dirname, './jest.preprocessor.js')},
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$'
  ],
  verbose: true
};
