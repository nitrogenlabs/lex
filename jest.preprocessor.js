const path = require('path');

const {relativeFilePath} = require('./dist/utils');

// babel-jest
const nodePath = path.resolve(__dirname, './node_modules');
const babelJestPath = relativeFilePath('babel-jest', nodePath);
const {createTransformer} = require(babelJestPath);

const babelOptions = require(path.resolve(__dirname, './babelOptions'));
const {ignore, ...updatedOptions} = babelOptions;
module.exports = createTransformer(updatedOptions);
