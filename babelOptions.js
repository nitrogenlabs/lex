const path = require('path');

const lexConfig = JSON.parse(process.env.LEX_CONFIG || '{}');
const {targetEnvironment, useTypescript} = lexConfig;
const nodePath = path.resolve(__dirname, './node_modules');
const babelWebEnv = [presetEnv, {modules: false, targets: {browsers: ['last 5 versions', 'ie >= 10']}}];
const babelNodeEnv = [presetEnv, {targets: {node: 'current'}}];

module.exports = {
  babelrc: false,
  comments: false,
  ignore: ['**/*.test.js', '**/*.test.ts', '**/*.test.tsx'],
  plugins: [
    `${nodePath}/@babel/plugin-proposal-pipeline-operator`
  ],
  presets: [
    targetEnvironment === 'web' ? babelWebEnv : babelNodeEnv,
    [`${nodePath}/@babel/preset-env`, {targets: {node: 'current'}}],
    [`${nodePath}/@babel/preset-stage-0`, {decoratorsLegacy: true, loose: false}],
    `${nodePath}/@babel/preset-react`,
    useTypescript ? `${nodePath}/@babel/preset-typescript` : `${nodePath}/@babel/preset-flow`
  ]
};
