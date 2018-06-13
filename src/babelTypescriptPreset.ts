import {declare} from '@babel/helper-plugin-utils';
import pluginPipeline from '@babel/plugin-proposal-pipeline-operator';
import presetEnv from '@babel/preset-env';
import presetReact from '@babel/preset-react';
import presetStage0 from '@babel/preset-stage-0';
import presetTypescript from '@babel/preset-typescript';

export default declare((api) => {
  api.assertVersion(7);

  return {
    plugins: [pluginPipeline],
    presets: [
      [presetEnv, {modules: false, targets: {browsers: ['last 5 versions', 'ie >= 10']}}],
      [presetStage0, {decoratorsLegacy: true, loose: false}],
      presetReact,
      presetTypescript
    ]
  };
});
