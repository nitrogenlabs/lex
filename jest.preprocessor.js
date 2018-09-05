const path = require('path');

const {jestPreprocessor} = require('./dist/preprocessor');

const babelOptions = require(path.resolve(__dirname, './babelOptions'));
const {ignore, ...updatedOptions} = babelOptions;
module.exports = jestPreprocessor(updatedOptions);
