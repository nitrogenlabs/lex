/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import path from 'path';

import {relativeFilePath} from './utils';

const nodePath = path.resolve(__dirname, '../node_modules');
const pluginPath: string = relativeFilePath('@babel/plugin-proposal-function-bind', nodePath, 1);

export const plugins = [
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

  `${pluginPath}/plugin-transform-modules-commonjs`
];
