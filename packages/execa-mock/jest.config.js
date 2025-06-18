/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import pack from './package.json' assert {type: 'json'};
import base from '../../jest.config.base.js';

export default {
  ...base,
  displayName: pack.name,
  rootDir: '.'
};
