
import {createTransformer} from 'babel-jest';
import {resolve} from 'path';

const nodePath = resolve(__dirname, '../node_modules');
const {process} = createTransformer({
  parserOpts: {
    plugins: ['jsx', 'typescript']
  },
  plugins: [
    `${nodePath}/@babel/plugin-transform-modules-commonjs`,
    [
      `${nodePath}/@babel/plugin-transform-runtime`,
      {
        corejs: 3
      }
    ]
  ],
  presets: [
    [
      `${nodePath}/@babel/preset-env`, {
        corejs: 3,
        targets: {
          node: 'current'
        }
      }
    ],
    `${nodePath}/@babel/preset-react`,
    `${nodePath}/@babel/preset-typescript`
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