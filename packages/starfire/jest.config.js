/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
const base = require('../../jest.config.base.js');
const pack = require('./package');

module.exports = {
  ...base,
  displayName: pack.name,
  name: pack.name,
  rootDir: '../..',
  testMatch: ['<rootDir>/packages/starfire/**/*.test.ts', '<rootDir>/packages/starfire/tests/**/jsfmt.spec.ts']
};
