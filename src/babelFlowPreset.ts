import {declare} from '@babel/helper-plugin-utils';
import pluginTransform from '@babel/plugin-transform-runtime';
import presetEnv from '@babel/preset-env';
import presetFlow from '@babel/preset-flow';
import presetReact from '@babel/preset-react';

import {plugins} from './babelPlugins';

const lexConfig = JSON.parse(process.env.LEX_CONFIG || '{}');
const {targetEnvironment} = lexConfig;
const babelWebEnv = [presetEnv, {modules: false, targets: {browsers: ['last 5 versions', 'ie >= 10']}}];
const babelNodeEnv = [presetEnv];

export default declare((api) => {
  api.assertVersion(7);

  return {
    plugins: [
      ...plugins,
      [pluginTransform, {
        helpers: false,
        polyfill: false,
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
