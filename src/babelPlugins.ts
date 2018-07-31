import path from 'path';

const nodePath = path.resolve(__dirname, '../node_modules');

export const plugins = [
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
  `${nodePath}/@babel/plugin-proposal-json-strings`
];
