/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */

// Read Jest config from LEX_CONFIG environment variable if available
let lexConfig = null;
if(process.env.LEX_CONFIG) {
  try {
    lexConfig = JSON.parse(process.env.LEX_CONFIG);
  } catch(error) {
    console.warn('Failed to parse LEX_CONFIG:', error.message);
  }
}

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
  moduleDirectories: ['node_modules', '<rootDir>'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testRegex: '(/__tests__/.*|\\.(test|spec|integration))\\.(ts|tsx|js|jsx)?$',
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', {
      jsc: {
        parser: {
          decorators: true,
          dynamicImport: true,
          syntax: 'typescript',
          tsx: true
        },
        transform: {
          react: {
            runtime: 'automatic'
          }
        }
      }
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(strip-indent|chalk|@testing-library/jest-dom|zod|@nlabs|@nlabs/arkhamjs|@nlabs/utils|@nlabs/lex)/.*)'
  ],
  verbose: true
};

// Merge with Lex config if available
if(lexConfig && lexConfig.jest) {
  module.exports = {
    ...baseConfig,
    ...lexConfig.jest
  };
} else {
  module.exports = baseConfig;
}