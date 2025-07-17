/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
const pack = require('./package.json');

module.exports = {
  displayName: pack.name,
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // Mock problematic ES modules
    '^execa$': '<rootDir>/__mocks__/execa.js',
    '^boxen$': '<rootDir>/__mocks__/boxen.js',
    '^chalk$': '<rootDir>/__mocks__/chalk.js',
    '^ora$': '<rootDir>/__mocks__/ora.js',
    // Mock modules that use import.meta.url
    '.*LexConfig.*': '<rootDir>/__mocks__/LexConfig.js',
    '.*build\\.js$': '<rootDir>/__mocks__/build.js',
    '.*versions\\.js$': '<rootDir>/__mocks__/versions.js',
    '.*compile\\.js$': '<rootDir>/__mocks__/compile.js',
    // Mock file utility to avoid import.meta.url issues
    'utils/file\\.js$': '<rootDir>/__mocks__/file.js',
    '.*/utils/file\\.js$': '<rootDir>/__mocks__/file.js',
    '^(\\.{1,2}/)*utils/file\\.js$': '<rootDir>/__mocks__/file.js',

  },
  rootDir: './',
  testMatch: ['<rootDir>/**/*.test.ts*'],
  transform: {
    '^.+\\.ts$|^.+\\.tsx$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {targets: {node: 'current'}}],
        '@babel/preset-typescript'
      ]
    }]
  },
  collectCoverage: false,
  transformIgnorePatterns: [],
  setupFilesAfterEnv: ['./jest.setup.js']
};
