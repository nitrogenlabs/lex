/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {fileURLToPath} from 'url';
import {dirname, resolve} from 'path';
import {deepMerge} from './dist/utils/deepMerge.js';

import {readFileSync} from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pack = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8'));

let projectJestConfig = null;
if(process.env.LEX_CONFIG) {
  try {
    const lexConfig = JSON.parse(process.env.LEX_CONFIG);
    projectJestConfig = lexConfig.jest;
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
  displayName: pack.name,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  rootDir: process.cwd(),
  testEnvironment: 'node',
  testRegex: '(/__tests__/.*|\\.(test|spec|integration))\\.(ts|tsx)?$',
  transform: {
    '^.+\.js$|^.+\.jsx$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {targets: {node: 'current'}}],
        '@babel/preset-typescript'
      ]
    }],
    '^.+\.ts$|^.+\.tsx$': ['babel-jest', {
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
  ? deepMerge(baseConfig, projectJestConfig)
  : baseConfig;

export default finalConfig;