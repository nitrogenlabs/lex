const {resolve} = require('path');

const rootDir = process.cwd();
const {jest, sourceFullPath, targetEnvironment, useTypescript} = JSON.parse(process.env.LEX_CONFIG || '{}');

// Polyfill path
const nodePath = resolve(__dirname, './node_modules');
const setupFiles = [
  `${nodePath}/core-js/stable/index.js`,
  `${nodePath}/regenerator-runtime/runtime.js`
];
let testEnvironment = 'node';
let testEnvironmentOptions = {};

if(targetEnvironment === 'web') {
  testEnvironment = 'jsdom';
  testEnvironmentOptions = {
    url: 'http://localhost'
  };
}

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
  moduleDirectories: [
    'node_modules',
    nodePath
  ],
  moduleFileExtensions,
  moduleNameMapper: {'\\.(css|jpg|png|svg|txt)$': resolve(__dirname, './emptyModule')},
  modulePaths: [
    rootDir,
    `${rootDir}/node_modules`,
    nodePath,
    sourceFullPath
  ],
  resolver: resolve(__dirname, './dist/resolver.js'),
  rootDir,
  setupFiles,
  testEnvironment,
  testEnvironmentOptions,
  testPathIgnorePatterns: [
    '/node_modules/',
    `${nodePath}/`
  ],
  testRegex,
  testRunner: `${nodePath}/jest-circus/runner.js`,
  transform: {
    '^.+\\.tsx?$': [
      `${nodePath}/@nlabs/esbuild-jest/dist/index.js`,
      {
        loaders: {
          '.js': 'js',
          '.ts': 'ts',
          '.test.ts': 'ts',
          '.spec.ts': 'ts',
          '.tsx': 'tsx',
          '.test.tsx': 'tsx',
          '.spec.tsx': 'tsx'
        },
        sourcemap: true
      }
    ],
    '\\.(gql|graphql)$': 'jest-transform-graphql'
  },
  transformIgnorePatterns,
  verbose: false,
  ...jest
};
