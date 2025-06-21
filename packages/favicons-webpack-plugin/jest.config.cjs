/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */

module.exports = {
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '(tests/.*.mock).(jsx?|tsx?)$'
  ],
  coverageReporters: ['html', 'text'],
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 5,
      lines: 10,
      statements: 5
    }
  },
  moduleDirectories: ['./node_modules'],
  moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
  moduleNameMapper: {
    '^(.*)\\.js$': '$1',
    '^(.*)\\.ts$': '$1'
  },
  modulePaths: ['node_modules'],
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '\\.(gql|graphql)$': 'jest-transform-graphql',
    '^.+\\.[jt]sx?$': 'babel-jest'
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|ts|tsx)$'
  ],
  verbose: true
};
