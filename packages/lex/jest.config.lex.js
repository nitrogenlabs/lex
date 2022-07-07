const path = require('path');

const {getNodePath} = require('./dist/utils/file');

const rootDir = process.cwd();
const {jest, sourceFullPath, useTypescript} = JSON.parse(process.env.LEX_CONFIG || '{}');

// Polyfill path
const nodePath = path.resolve(__dirname, './node_modules');
const setupFiles = [
  getNodePath('core-js'),
  getNodePath('regenerator-runtime/runtime.js')
];
let moduleFileExtensions = ['js', 'json'];
let testRegex = '(/__tests__/.*|\\.(test|spec))\\.(js)?$';
let transformIgnorePatterns = ['[/\\\\]node_modules[/\\\\].+\\.(js)$'];

if(useTypescript) {
  moduleFileExtensions = ['js', 'ts', 'tsx', 'json'];
  testRegex = '(/__tests__/.*|\\.(test|spec))\\.(ts|tsx)?$';
  transformIgnorePatterns = ['[/\\\\]node_modules[/\\\\].+\\.(js|ts|tsx)$'];
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
  setupFiles,
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '/node_modules/',
    `${nodePath}/`
  ],
  testRegex,
  testURL: 'http://localhost',
  transformIgnorePatterns,
  verbose: false,
  ...jest
};
