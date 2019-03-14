const path = require('path');

const {relativeFilePath} = require('./dist/utils');

const rootDir = process.cwd();
const {jest, sourceFullPath, useTypescript} = JSON.parse(process.env.LEX_CONFIG || '{}');

// Polyfill path
const nodePath = path.resolve(__dirname, './node_modules');
const babelPolyfillPath = relativeFilePath('@babel/polyfill/dist/polyfill.js', nodePath);
let moduleFileExtensions = ['js', 'json'];
let testRegex = '(/__tests__/.*|\\.(test|spec))\\.(js|jsx)?$';
let transform = {'\\.(js)$': path.resolve(__dirname, './jest.preprocessor.js')};
let transformIgnorePatterns = ['[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$'];

if(useTypescript) {
  moduleFileExtensions = ['js', 'ts', 'tsx', 'json'];
  testRegex = '(/__tests__/.*|\\.(test|spec))\\.(js|jsx|ts|tsx)?$';
  transform = {'\\.(js|ts|tsx)$': path.resolve(__dirname, './jest.preprocessor.js')};
  transformIgnorePatterns = ['[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$'];
}

module.exports = {
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/dist', '/lib', '__snapshots__', '.d.ts'],
  coverageReporters: ['html', 'text'],
  moduleDirectories: ['node_modules'],
  moduleFileExtensions,
  moduleNameMapper: {'\\.(css|jpg|png|svg|txt)$': path.resolve(__dirname, './emptyModule')},
  modulePaths: [
    `${rootDir}/node_modules`,
    nodePath,
    sourceFullPath
  ],
  resolver: path.resolve(__dirname, './dist/resolver.js'),
  rootDir,
  setupFiles: [babelPolyfillPath],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '/node_modules/',
    `${nodePath}/`
  ],
  testRegex,
  testURL: 'http://localhost',
  transform,
  transformIgnorePatterns,
  verbose: false,
  ...jest
};
