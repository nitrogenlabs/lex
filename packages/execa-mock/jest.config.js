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
  testMatch: ['<rootDir>/packages/execa-mock/**/*.test.ts']
};
