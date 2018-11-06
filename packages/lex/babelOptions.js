/**
 * Copyright (c) 2018, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
const path = require('path');

const {relativeFilePath} = require('./dist/utils');

const lexConfig = JSON.parse(process.env.LEX_CONFIG || '{}');
const {babel = {}, commandName, targetEnvironment, useTypescript} = lexConfig;
const {plugins: babelPlugins = [], presets: babelPresets = []} = babel;

// Babel Plugin/preset paths
const nodePath = path.resolve(__dirname, './node_modules');
const pluginPath = relativeFilePath('@babel/plugin-proposal-function-bind', nodePath, 1);

// Presets
const presetEnvPath = `${pluginPath}/preset-env`;
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
  // Styled Components
  [`${pluginPath}/../babel-plugin-styled-components`],

  // Stage 0
  `${pluginPath}/plugin-proposal-function-bind`,

  // Stage 1
  `${pluginPath}/plugin-proposal-export-default-from`,
  `${pluginPath}/plugin-proposal-logical-assignment-operators`,
  [`${pluginPath}/plugin-proposal-optional-chaining`, {loose: false}],
  [`${pluginPath}/plugin-proposal-pipeline-operator`, {proposal: 'minimal'}],
  [`${pluginPath}/plugin-proposal-nullish-coalescing-operator`, {loose: false}],
  `${pluginPath}/plugin-proposal-do-expressions`,

  // Stage 2
  [`${pluginPath}/plugin-proposal-decorators`, {legacy: true}],
  `${pluginPath}/plugin-proposal-function-sent`,
  `${pluginPath}/plugin-proposal-export-namespace-from`,
  `${pluginPath}/plugin-proposal-numeric-separator`,
  `${pluginPath}/plugin-proposal-throw-expressions`,

  // Stage 3
  `${pluginPath}/plugin-syntax-dynamic-import`,
  `${pluginPath}/plugin-syntax-import-meta`,
  [`${pluginPath}/plugin-proposal-class-properties`, {loose: false}],
  `${pluginPath}/plugin-proposal-json-strings`,

  // User provided plugins
  ...babelPlugins
];

const presets = [
  presetEnv,

  // React
  `${pluginPath}/preset-react`,

  // Transpilers
  useTypescript ? `${pluginPath}/preset-typescript` : `${pluginPath}/preset-flow`,

  // User provided presets
  ...babelPresets
];

if(commandName === 'dev') {
  plugins.push(`${pluginPath}/../react-hot-loader/babel.js`);
}

// Configuration for babel 7
module.exports = {
  babelrc: false,
  comments: false,
  ignore: ['**/*.test.js', '**/*.test.ts', '**/*.test.tsx'],
  plugins,
  presets
};
