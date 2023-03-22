import pluginCjsTransform from '@babel/plugin-transform-modules-commonjs';
import pluginRuntime from '@babel/plugin-transform-runtime';
import presetEnv from '@babel/preset-env';
import presetReact from '@babel/preset-react';
import presetTypescript from '@babel/preset-typescript';
import {createTransformer} from 'babel-jest';
import presetReactNative from 'metro-react-native-babel-preset';

export interface BabelTransformOptions {
  readonly sourceText: string;
  readonly sourcePath: string;
  readonly options?: any;
}

export const babelTransform = ({sourceText, sourcePath, options = {}}: BabelTransformOptions) => {
  const {presets: babelPresets = []} = options;
  const presets = [
    [
      presetEnv, {
        targets: {
          node: 'current'
        }
      }
    ]
  ];

  if(babelPresets.includes('react')) {
    presets.push(presetReact);
  }

  if(babelPresets.includes('react-native')) {
    presets.push(presetReactNative);
  }

  if(babelPresets.includes('typescript')) {
    presets.push(presetTypescript);
  }

  const {process} = createTransformer({
    parserOpts: {
      plugins: ['jsx', 'typescript']
    },
    plugins: [
      pluginCjsTransform,
      pluginRuntime
    ],
    presets
  });

  const babelResult = process(sourceText, sourcePath, options) as {code: string};
  return babelResult.code;
};