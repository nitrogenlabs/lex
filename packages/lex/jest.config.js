/**
 * Copyright (c) 2018, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
const base = require('../../jest.config.base.js');
const pack = require('./package');

module.exports = {
  ...base,
  displayName: pack.name,
  name: pack.name,
  rootDir: '../..',
  setupFiles: ['<rootDir>/packages/lex/jest.setup.js'],
  testMatch: ['<rootDir>/packages/lex/**/*.test.ts']
};
