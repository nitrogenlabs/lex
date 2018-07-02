import {declare} from '@babel/helper-plugin-utils';
import pluginPipeline from '@babel/plugin-proposal-pipeline-operator';
import pluginDynamicImport from '@babel/plugin-syntax-dynamic-import';
import presetEnv from '@babel/preset-env';
import presetES2015 from '@babel/preset-es2015';
import presetFlow from '@babel/preset-flow';
import presetReact from '@babel/preset-react';
import presetStage0 from '@babel/preset-stage-0';

const lexConfig = JSON.parse(process.env.LEX_CONFIG || '{}');
const {targetEnvironment} = lexConfig;
const babelWebEnv = [presetEnv, {modules: false, targets: {browsers: ['last 5 versions', 'ie >= 10']}}];
const babelNodeEnv = [presetES2015, {modules: false}];

export default declare((api) => {
  api.assertVersion(7);

  return {
    plugins: [
      pluginPipeline,
      pluginDynamicImport
    ],
    presets: [
      targetEnvironment === 'web' ? babelWebEnv : babelNodeEnv,
      [presetStage0, {decoratorsLegacy: true, loose: false}],
      presetReact,
      presetFlow
    ]
  };
});
