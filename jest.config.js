/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */

/** @type {import('jest').Config} */
const config = {
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '(tests/.*.mock).(jsx?|tsx?)$'
  ],
  coverageReporters: ['html', 'text'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 80,
      statements: 80
    }
  },
  moduleDirectories: ['./node_modules'],
  moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
  modulePaths: ['node_modules'],
  projects: ['<rootDir>/packages/*'],
  testEnvironment: 'node',
  transform: {
    '\\.(gql|graphql)$': 'jest-transform-graphql',
    '^.+\\.[jt]sx?$': ['ts-jest']
  },
  verbose: true
};

module.exports = config;
