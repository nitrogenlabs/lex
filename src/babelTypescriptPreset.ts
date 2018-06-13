import {declare} from '@babel/helper-plugin-utils';
import pluginPipeline from '@babel/plugin-proposal-pipeline-operator';
import presetEnv from '@babel/preset-env';
import presetReact from '@babel/preset-react';
import presetStage0 from '@babel/preset-stage-0';
import presetTypescript from '@babel/preset-typescript';

const lexConfig = JSON.parse(process.env.LEX_CONFIG || '{}');
const {targetEnvironment} = lexConfig;
const babelWebEnv = [presetEnv, {modules: false, targets: {browsers: ['last 5 versions', 'ie >= 10']}}];
const babelNodeEnv = [presetEnv, {targets: {node: 'current'}}];

export default declare((api) => {
  api.assertVersion(7);

  return {
    plugins: [pluginPipeline],
    presets: [
      targetEnvironment === 'web' ? babelWebEnv : babelNodeEnv,
      [presetStage0, {decoratorsLegacy: true, loose: false}],
      presetReact,
      presetTypescript
    ]
  };
});
