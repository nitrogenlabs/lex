/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
const base = require('../../jest.config.base');
const pack = require('./package.json');

module.exports = {
  ...base,
  displayName: pack.name,
  rootDir: '../..',
  setupFiles: ['<rootDir>/packages/lex/jest.setup.js'],
  testMatch: ['<rootDir>/packages/lex/**/*.test.ts']
};
