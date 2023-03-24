import {join as pathJoin} from 'path';

module.exports = {
  context: __dirname,
  devtool: 'eval',
  entry: './src/entry.js',
  output: {
    filename: 'bundle.js',
    path: pathJoin(__dirname, 'dist')
  }
};
