/**
 * Copyright (c) 2020-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import presetEnv from '@babel/preset-env';

export const babelNodeEnv = [
  presetEnv,
  {
    corejs: 3,
    useBuiltIns: 'usage'
  }
];

export const babelTestEnv = [
  presetEnv,
  {
    corejs: 3,
    useBuiltIns: 'usage'
  }
];

export const babelWebEnv = [
  presetEnv, {
    corejs: 3,
    modules: false,
    useBuiltIns: 'usage'
  }
];
