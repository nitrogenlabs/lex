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

export const babelTransform = (babelPresets: any) => {
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

  return createTransformer({
    parserOpts: {
      plugins: ['jsx', 'typescript']
    },
    plugins: [
      pluginCjsTransform,
      pluginRuntime
    ],
    presets
  }) as any;
};

export const transformerSync = ({sourceText, sourcePath, options = {}}: BabelTransformOptions) => {
  const {transformerConfig = {}} = options;
  const {presets = []} = transformerConfig;
  const {process} = babelTransform(presets);
  return process(sourceText, sourcePath, options);
};

export const transformerAsync = async ({sourceText, sourcePath, options = {}}: BabelTransformOptions) => {
  const {transformerConfig = {}} = options;
  const {presets = []} = transformerConfig;
  const {processAsync} = babelTransform(presets);
  return processAsync(sourceText, sourcePath, options);
};
