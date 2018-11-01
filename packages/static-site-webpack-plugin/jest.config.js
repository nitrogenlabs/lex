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
  testMatch: ['<rootDir>/packages/static-site-webpack-plugin/**/*.test.js']
};
