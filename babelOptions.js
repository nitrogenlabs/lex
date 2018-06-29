const path = require('path');

const lexConfig = JSON.parse(process.env.LEX_CONFIG || '{}');
const {commandName, targetEnvironment, useTypescript} = lexConfig;
const nodePath = path.resolve(__dirname, './node_modules');
const presetEnvPath = `${nodePath}/@babel/preset-env`;
const babelNodeEnv = [presetEnvPath, {targets: {node: 'current'}}];
const babelTestEnv = presetEnvPath;
const babelWebEnv = [presetEnvPath, {modules: false, targets: {browsers: ['last 5 versions', 'ie >= 10']}}];

// Set correct build environment
let presetEnv;
const plugins = [
  `${nodePath}/@babel/plugin-proposal-pipeline-operator`,
  `${nodePath}/@babel/plugin-syntax-dynamic-import`
];

if(commandName === 'dev') {
  plugins.push(`${nodePath}/react-hot-loader/babel.js`);
}

if(commandName === 'test') {
  presetEnv = babelTestEnv;
} else if(targetEnvironment === 'web') {
  presetEnv = babelWebEnv;
} else {
  presetEnv = babelNodeEnv;
}

// Configuration for babel 7
module.exports = {
  babelrc: false,
  comments: false,
  ignore: ['**/*.test.js', '**/*.test.ts', '**/*.test.tsx'],
  plugins,
  presets: [
    presetEnv,
    [`${nodePath}/@babel/preset-stage-0`, {decoratorsLegacy: true, loose: false}],
    `${nodePath}/@babel/preset-react`,
    useTypescript ? `${nodePath}/@babel/preset-typescript` : `${nodePath}/@babel/preset-flow`
  ]
};
