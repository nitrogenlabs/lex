
import {createTransformer} from 'babel-jest';
import pluginCjsTransform from '@babel/plugin-transform-modules-commonjs';
import pluginRuntime from '@babel/plugin-transform-runtime';
import presetEnv from '@babel/preset-env';
import presetReact from '@babel/preset-react';
import presetTypescript from '@babel/preset-typescript';

const {process} = createTransformer({
  parserOpts: {
    plugins: ['jsx', 'typescript']
  },
  plugins: [
    pluginCjsTransform,
    pluginRuntime
  ],
  presets: [
    [
      presetEnv, {
        targets: {
          node: 'current'
        }
      }
    ],
    presetReact,
    presetTypescript
  ]
});

export interface BabelTransformOptions {
  readonly sourceText: string;
  readonly sourcePath: string;
  readonly options?: any;
}

export const babelTransform = ({sourceText, sourcePath, options}: BabelTransformOptions) => {
  const babelResult = process(sourceText, sourcePath, options) as {code: string};
  return babelResult.code;
};