const path = require('path');

const lexConfig = JSON.parse(process.env.LEX_CONFIG || '{}');
const {babelPlugins = [], babelPresets = [], commandName, targetEnvironment, useTypescript} = lexConfig;
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
  // Stage 0
  `${nodePath}/@babel/plugin-proposal-function-bind`,

  // Stage 1
  `${nodePath}/@babel/plugin-proposal-export-default-from`,
  `${nodePath}/@babel/plugin-proposal-logical-assignment-operators`,
  [`${nodePath}/@babel/plugin-proposal-optional-chaining`, {loose: false}],
  [`${nodePath}/@babel/plugin-proposal-pipeline-operator`, {proposal: 'minimal'}],
  [`${nodePath}/@babel/plugin-proposal-nullish-coalescing-operator`, {loose: false}],
  `${nodePath}/@babel/plugin-proposal-do-expressions`,

  // Stage 2
  [`${nodePath}/@babel/plugin-proposal-decorators`, {legacy: true}],
  `${nodePath}/@babel/plugin-proposal-function-sent`,
  `${nodePath}/@babel/plugin-proposal-export-namespace-from`,
  `${nodePath}/@babel/plugin-proposal-numeric-separator`,
  `${nodePath}/@babel/plugin-proposal-throw-expressions`,

  // Stage 3
  `${nodePath}/@babel/plugin-syntax-dynamic-import`,
  `${nodePath}/@babel/plugin-syntax-import-meta`,
  [`${nodePath}/@babel/plugin-proposal-class-properties`, {loose: false}],
  `${nodePath}/@babel/plugin-proposal-json-strings`,

  // User provided plugins
  ...babelPlugins
];

const presets = [
  presetEnv,

  // React
  `${nodePath}/@babel/preset-react`,

  // Transpilers
  useTypescript ? `${nodePath}/@babel/preset-typescript` : `${nodePath}/@babel/preset-flow`,

  // User provided presets
  ...babelPresets
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
