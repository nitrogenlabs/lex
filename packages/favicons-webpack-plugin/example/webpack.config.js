const path = require('path');

module.exports = {
  context: __dirname,
  devtool: 'eval',
  entry: './src/entry.js',
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'dist')
  }
};
