/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
const path = require('path');

module.exports = {
  collectCoverage: true,
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
  moduleDirectories: [
    './node_modules'
  ],
  moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
  modulePaths: [
    'node_modules'
  ],
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': [
      'esbuild-jest',
      {
        sourcemap: true,
        loaders: {
          '.js': 'js',
          '.ts': 'ts',
          '.test.ts': 'ts',
          '.tsx': 'tsx',
          '.test.tsx': 'tsx',
        }
      }
    ],
    '\\.(gql|graphql)$': 'jest-transform-graphql'
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$',
    path.resolve(__dirname, './packages/execa-mock/node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$'),
    path.resolve(__dirname, './packages/favicons-webpack-plugin/node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$'),
    path.resolve(__dirname, './packages/lex/node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$'),
    path.resolve(__dirname, './packages/starfire/node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$'),
    path.resolve(__dirname, './packages/static-site-webpack-plugin/node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$')
  ],
  verbose: true
};
