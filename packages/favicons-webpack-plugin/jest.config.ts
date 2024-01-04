/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import base from '../../jest.config.base';
import pack from './package.json' assert { type: 'json' };

module.exports = {
  ...base,
  displayName: pack.name,
  rootDir: '../..',
  testMatch: ['<rootDir>/packages/favicons-webpack-plugin/**/*.test.ts']
};
