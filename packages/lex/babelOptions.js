/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
const path = require('path');

const {relativeFilePath} = require('./dist/utils');

const lexConfig = JSON.parse(process.env.LEX_CONFIG || '{}');
const {babel, commandName, preset, targetEnvironment, useTypescript} = lexConfig;

// Babel Plugin/preset paths
const {plugins: babelPlugins = [], presets: babelPresets = []} = babel || {};
const nodePath = path.resolve(__dirname, './node_modules');
const pluginPath = relativeFilePath('@babel/plugin-proposal-function-bind', nodePath, 1);

// Presets
const presetEnvPath = `${pluginPath}/preset-env`;
const babelNodeEnv = [presetEnvPath];
const babelTestEnv = [presetEnvPath];
const babelWebEnv = [presetEnvPath, {modules: false, targets: {browsers: ['last 5 versions', 'ie 11']}}];

// Plugins
const plugins = [
  // Styled Components
  [`${pluginPath}/../babel-plugin-styled-components`],

  // Stage 0
  `${pluginPath}/plugin-proposal-function-bind`,

  // Stage 1
  `${pluginPath}/plugin-proposal-logical-assignment-operators`,
  [`${pluginPath}/plugin-proposal-optional-chaining`, {loose: false}],
  [`${pluginPath}/plugin-proposal-pipeline-operator`, {proposal: 'minimal'}],
  [`${pluginPath}/plugin-proposal-nullish-coalescing-operator`, {loose: false}],
  `${pluginPath}/plugin-proposal-do-expressions`,

  // Stage 2
  [`${pluginPath}/plugin-proposal-decorators`, {legacy: true}],
  `${pluginPath}/plugin-proposal-function-sent`,
  `${pluginPath}/plugin-proposal-numeric-separator`,
  `${pluginPath}/plugin-proposal-throw-expressions`,

  // Stage 3
  [`${pluginPath}/plugin-proposal-class-properties`, {loose: false}],
  `${pluginPath}/plugin-proposal-json-strings`,

  // Import/Exports
  `${pluginPath}/plugin-syntax-dynamic-import`,
  `${pluginPath}/plugin-syntax-import-meta`,
  `${pluginPath}/plugin-proposal-export-default-from`,
  `${pluginPath}/plugin-proposal-export-namespace-from`,

  // CommonJS
  `${pluginPath}/plugin-transform-modules-commonjs`,

  // User provided plugins
  ...babelPlugins
];

// Set correct build environment
let presetEnv;

if(commandName === 'test') {
  presetEnv = babelTestEnv;
} else if(preset === 'web' || targetEnvironment === 'web') {
  presetEnv = babelWebEnv;
} else {
  plugins.push([`${pluginPath}/plugin-transform-runtime`, {helpers: false, regenerator: true}]);
  presetEnv = babelNodeEnv;
}

const presets = [
  presetEnv,

  // React
  `${pluginPath}/preset-react`,

  // Transpilers
  useTypescript ? `${pluginPath}/preset-typescript` : `${pluginPath}/preset-flow`,

  // User provided presets
  ...babelPresets
];

// Configuration for babel 7
module.exports = {
  babelrc: false,
  comments: false,
  ignore: ['**/*.test.js', '**/*.test.ts', '**/*.test.tsx'],
  plugins,
  presets
};
