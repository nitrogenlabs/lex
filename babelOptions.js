const path = require('path');

const lexConfig = JSON.parse(process.env.LEX_CONFIG || '{}');
const {commandName, targetEnvironment, useTypescript} = lexConfig;
const nodePath = path.resolve(__dirname, './node_modules');
const presetEnvPath = `${nodePath}/@babel/preset-env`;
const babelNodeEnv = [presetEnvPath];
const babelTestEnv = [presetEnvPath];
const babelWebEnv = [presetEnvPath, {modules: false, targets: {browsers: ['last 5 versions', 'ie >= 10']}}];

// Set correct build environment
let presetEnv;

if(commandName === 'test') {
  presetEnv = babelTestEnv;
} else if(targetEnvironment === 'web') {
  presetEnv = babelWebEnv;
} else {
  presetEnv = babelNodeEnv;
}

const plugins = [
  `${nodePath}/@babel/plugin-proposal-pipeline-operator`,
  `${nodePath}/@babel/plugin-syntax-dynamic-import`
];
const presets = [
  presetEnv,
  [`${nodePath}/@babel/preset-stage-0`, {decoratorsLegacy: true, loose: false}],
  `${nodePath}/@babel/preset-react`,
  useTypescript ? `${nodePath}/@babel/preset-typescript` : `${nodePath}/@babel/preset-flow`
];

if(commandName === 'dev') {
  plugins.push(`${nodePath}/react-hot-loader/babel.js`);
}

// Configuration for babel 7
module.exports = {
  babelrc: false,
  comments: false,
  ignore: ['**/*.test.js', '**/*.test.ts', '**/*.test.tsx'],
  plugins,
  presets
};
