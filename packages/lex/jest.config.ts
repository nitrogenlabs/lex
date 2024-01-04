/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import packageJson from './package.json' assert {type: 'json'};

export default {
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
  displayName: packageJson.name,
  preset: 'ts-jest/presets/js-with-babel',
  rootDir: './',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/**/*.test.ts*'],
  transformIgnorePatterns: [
    '!/node_modules/(?!execa)'

  ]
};
