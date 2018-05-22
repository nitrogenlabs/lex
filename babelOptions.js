const path = require('path');
const lexConfig = JSON.parse(process.env.LEX_CONFIG);
const {useTypescript} = lexConfig;
const nodePath = path.resolve(__dirname, './node_modules');

module.exports = {
  babelrc: false,
  comments: false,
  ignore: ['**/*.test.js', '**/*.test.ts', '**/*.test.tsx'],
  plugins: [
    `${nodePath}/@babel/plugin-proposal-pipeline-operator`
  ],
  presets: [
    `${nodePath}/@babel/preset-env`,
    useTypescript ? `${nodePath}/@babel/preset-typescript` : `${nodePath}/@babel/preset-flow`,
    `${nodePath}/@babel/preset-react`,
    [`${nodePath}/@babel/preset-stage-0`, {decoratorsLegacy: true}]
  ]
};
