
import {createTransformer} from 'babel-jest';
import {resolve} from 'path';

import {getNodePath} from './utils/file';

const {process} = createTransformer({
  parserOpts: {
    plugins: ['jsx', 'typescript']
  },
  plugins: [
    getNodePath('@babel/plugin-transform-modules-commonjs'),
    [
      getNodePath('@babel/plugin-transform-runtime'),
      {
        corejs: 3,
        useBuiltIns: 'usage'
      }
    ]
  ],
  presets: [
    [
      getNodePath('@babel/preset-env'), {
        corejs: 3,
        targets: {
          node: 'current'
        },
        useBuiltIns: 'usage'
      }
    ],
    getNodePath('@babel/preset-react'),
    getNodePath('@babel/preset-typescript')
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