const path = require('path');

const nodePath = path.resolve(__dirname, './node_modules');
const babelOptions = require(path.resolve(__dirname, './babelOptions'));

delete babelOptions.ignore;
module.exports = require(`${nodePath}/babel-jest`).createTransformer(babelOptions);
