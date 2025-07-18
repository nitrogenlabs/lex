/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {readFileSync} from 'fs';
import {fileURLToPath} from 'url';
import {dirname, resolve} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pack = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8'));

export default {
  displayName: pack.name,
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
  moduleDirectories: ['js', '.', 'node_modules'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^execa$': resolve(__dirname, '__mocks__/execa.js'),
    '^boxen$': resolve(__dirname, '__mocks__/boxen.js'),
    '^chalk$': resolve(__dirname, '__mocks__/chalk.js'),
    '^ora$': resolve(__dirname, '__mocks__/ora.js'),
    '^latest-version$': resolve(__dirname, '__mocks__/latest-version.js'),
    '^compare-versions$': resolve(__dirname, '__mocks__/compare-versions.js'),
    '.*LexConfig.*': resolve(__dirname, '__mocks__/LexConfig.js'),
    '.*build\\.js$': resolve(__dirname, '__mocks__/build.js'),
    '.*versions\\.js$': resolve(__dirname, '__mocks__/versions.js'),
    '.*compile\\.js$': resolve(__dirname, '__mocks__/compile.js'),
    'utils/file\\.js$': resolve(__dirname, '__mocks__/file.js'),
    '.*/utils/file\\.js$': resolve(__dirname, '__mocks__/file.js'),
    '^(\\.{1,2}/)*utils/file\\.js$': resolve(__dirname, '__mocks__/file.js'),
    // '^(\.{1,2}/.*)\.js$': '$1',
    '\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': resolve(__dirname, '__mocks__/fileMock.js')
  },
  rootDir: process.cwd(),
  transformIgnorePatterns: [
    'node_modules/(?!(strip-indent|chalk|@testing-library/jest-dom|zod|@nlabs|@nlabs/arkhamjs|@nlabs/utils|@nlabs/lex|react-markdown|devlop)/.*)'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\.js$|^.+\.jsx$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {targets: {node: 'current'}}],
        '@babel/preset-react'
      ]
    }],
    '^.+\.ts$|^.+\.tsx$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {targets: {node: 'current'}}],
        '@babel/preset-typescript',
        '@babel/preset-react'
      ]
    }]
  },
  testRegex: '(/__tests__/.*|\\.(test|spec|integration))\\.(ts|tsx)?$',
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
  verbose: true
};