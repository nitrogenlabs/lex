import { existsSync } from 'fs';
import { resolve as pathResolve } from 'path';
import { URL } from 'url';

import { getNodePath } from './dist/utils/file.js';

const rootDir = process.cwd();
const { jest, sourceFullPath, targetEnvironment, useTypescript } = JSON.parse(
  process.env.LEX_CONFIG || '{}'
);

const dirName = new URL('.', import.meta.url).pathname;
const nodePath = pathResolve(dirName, './node_modules');

// Check if setup files exist
const lexSetupFile = pathResolve(dirName, './jest.setup.js');
const projectSetupFile = pathResolve(rootDir, './jest.setup.js');
const setupFilesAfterEnv = [];

// Add Lex's setup file if it exists
if(existsSync(lexSetupFile)) {
  setupFilesAfterEnv.push(lexSetupFile);
}

// Add project's setup file if it exists
if(existsSync(projectSetupFile)) {
  setupFilesAfterEnv.push(projectSetupFile);
}

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
let transformIgnorePatterns = [];

if(useTypescript) {
  moduleFileExtensions = ['js', 'ts', 'tsx', 'json'];
  testRegex = '(/__tests__/.*|\\.(test|spec))\\.(ts|tsx)?$';
  transformIgnorePatterns = [];
}

// Create a base config
const baseConfig = {
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist',
    '/lib',
    '__snapshots__',
    '.d.ts'
  ],
  coverageReporters: ['html', 'text'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleDirectories: ['node_modules', nodePath],
  moduleFileExtensions,
  moduleNameMapper: {
    '^chalk$': getNodePath('chalk/source/index.js'),
    '^#ansi-styles$': getNodePath('chalk/node_modules/ansi-styles/index.js'),
    '^#supports-color$': getNodePath('chalk/node_modules/supports-color/index.js'),
    '\\.(css|jpg|png|svg|txt)$': pathResolve(dirName, './emptyModule')
  },
  modulePaths: [rootDir, `${rootDir}/node_modules`, nodePath, sourceFullPath],
  // preset: 'ts-jest', // Removed to avoid resolution issues
  resolver: pathResolve(dirName, './resolver.cjs'),
  rootDir,
  setupFiles: [
    getNodePath('core-js'),
    getNodePath('regenerator-runtime/runtime.js')
  ],
  // Only add setupFilesAfterEnv if there are entries
  ...(setupFilesAfterEnv.length > 0 ? { setupFilesAfterEnv } : {}),
  testEnvironment,
  testEnvironmentOptions,
  testPathIgnorePatterns: ['/node_modules/', `${nodePath}/`],
  testRegex,
  testRunner: getNodePath('jest-circus/runner.js'),
  transform: {
    ...(useTypescript ? {
      '\\.tsx?$': [getNodePath('ts-jest/dist/index.js'), {
        useESM: true
      }]
    } : {
      '\\.[jt]sx?$': getNodePath('babel-jest')
    }),
    '\\.(gql|graphql)$': getNodePath('jest-transform-graphql')
  },
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|@testing-library/jest-dom)/)'
  ],
  verbose: true
};

// Deep merge function
const deepMerge = (target, source) => {
  if(!source) return target;
  const output = { ...target };

  Object.keys(source).forEach(key => {
    if(source[key] instanceof Object && key in target && target[key] instanceof Object && !Array.isArray(source[key]) && !Array.isArray(target[key])) {
      output[key] = {...target[key], ...source[key]};
    } else if(Array.isArray(source[key]) && Array.isArray(target[key])) {
      // Merge arrays
      output[key] = [...target[key], ...source[key]];
    } else {
      output[key] = source[key];
    }
  });

  return output;
};

// Export the merged configuration
export default deepMerge(baseConfig, jest);
