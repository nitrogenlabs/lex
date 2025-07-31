/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {readFileSync} from 'fs';
import merge from 'lodash/merge.js';
import {dirname, resolve} from 'path';
import {fileURLToPath} from 'url';

const filename = fileURLToPath(import.meta.url);
const dirnamePath = dirname(filename);
const pack = JSON.parse(readFileSync(resolve(dirnamePath, 'package.json'), 'utf8'));

let projectJestConfig = null;

if(process.env.LEX_CONFIG) {
  try {
    const lexConfig = JSON.parse(process.env.LEX_CONFIG);
    projectJestConfig = lexConfig.jest;
  } catch (error) {
    // eslint-disable-next-line no-console
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
  displayName: pack.name,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  rootDir: process.cwd(),
  testEnvironment: 'node',
  testRegex: '(/__tests__/.*|\\.(test|spec|integration))\\.(ts|tsx)?$',
  transform: {
    '^.+\\.js$|^.+\\.jsx$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {targets: {node: 'current'}}],
        '@babel/preset-typescript'
      ]
    }],
    '^.+\\.ts$|^.+\\.tsx$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {targets: {node: 'current'}}],
        '@babel/preset-typescript',
        ['@babel/preset-react', {runtime: 'automatic'}]
      ]
    }]
  },
  verbose: true
};

const finalConfig = projectJestConfig && Object.keys(projectJestConfig).length > 0
  ? merge(baseConfig, projectJestConfig)
  : baseConfig;

export default finalConfig;