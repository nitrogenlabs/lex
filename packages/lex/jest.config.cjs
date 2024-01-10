/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
const base = require('../../jest.config.base');
const pack = require('./package.json');

module.exports = {
  ...base,
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
  displayName: pack.name,
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  rootDir: './',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/**/*.test.ts*'],
  transform: {
    '\\.[jt]sx?$': [
      'ts-jest',
      {
        astTransformers: {
          before: [
            {
              path: '../../node_modules/ts-jest-mock-import-meta',
              options: {metaObjectReplacement: {url: 'https://www.url.com'}}
            }
          ]
        },
        diagnostics: {
          ignoreCodes: [1343]
        },
        useESM: true
      }
    ]
  },
  transformIgnorePatterns: [
    '!/node_modules/(?!execa)'
  ]
};
