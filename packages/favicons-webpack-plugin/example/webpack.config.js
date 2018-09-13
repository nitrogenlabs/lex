const FaviconsPlugin = require('..');

const HtmlPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  context: __dirname,
  devtool: 'eval',
  entry: './src/entry.js',
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'dist')
  },
  plugins: [
    new FaviconsFaviconsPlugin('./src/logo.png'),
    new HtmlPlugin()
  ]
};
