/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {declare} from '@babel/helper-plugin-utils';
import presetEnv from '@babel/preset-env';
import presetReact from '@babel/preset-react';
import presetTypescript from '@babel/preset-typescript';

import {plugins} from './babelPlugins';

// import pluginTransform from '@babel/plugin-transform-runtime';
const lexConfig = JSON.parse(process.env.LEX_CONFIG || '{}');
const {targetEnvironment} = lexConfig;
const babelWebEnv = [presetEnv, {
  modules: false,
  targets: {
    browsers: ['last 5 versions'],
    ie: '11'
  }
}];
const babelNodeEnv = [presetEnv];

export default declare((api) => {
  api.assertVersion(7);

  return {
    plugins: [
      ...plugins
      // [pluginTransform, {
      //   helpers: false,
      //   regenerator: true
      // }]
    ],
    presets: [
      targetEnvironment === 'web' ? babelWebEnv : babelNodeEnv,
      presetReact,
      presetTypescript
    ]
  };
});
