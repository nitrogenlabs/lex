/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {declare} from '@babel/helper-plugin-utils';
import pluginTransform from '@babel/plugin-transform-runtime';
import presetFlow from '@babel/preset-flow';
import presetReact from '@babel/preset-react';

import {babelNodeEnv, babelWebEnv} from './babelEnv';
import {plugins} from './babelPlugins';

const lexConfig = JSON.parse(process.env.LEX_CONFIG || '{}');
const {targetEnvironment} = lexConfig;

export default declare((api) => {
  api.assertVersion(7);

  return {
    plugins: [
      ...plugins,
      [pluginTransform, {
        helpers: false,
        regenerator: true
      }]
    ],
    presets: [
      targetEnvironment === 'web' ? babelWebEnv : babelNodeEnv,
      presetReact,
      presetFlow
    ]
  };
});
