/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import base from '../../jest.config.base.js';
import pack from './package.json' assert {type: 'json'};

export default {
  ...base,
  displayName: pack.name,
  rootDir: '../..',
  setupFiles: ['<rootDir>/packages/lex/jest.setup.js'],
  testMatch: ['<rootDir>/packages/lex/**/*.test.ts']
};
