const CompressionPlugin = require('compression-webpack-plugin');
const ejs = require('ejs');
const fs = require('fs');

const {StaticSitePlugin} = require('../../../src');

const template = ejs.compile(fs.readFileSync(`${__dirname}/template.ejs`, 'utf-8'));

module.exports = {
  entry: {
    index:`${__dirname}/index.js`
  },
  mode: 'production',
  output: {
    filename: 'index.js',
    libraryTarget: 'umd',
    path: `${__dirname}/actualOutput`
  },
  plugins: [
    new StaticSitePlugin({
      locals: {
        template
      }
    }),
    new CompressionPlugin({
      algorithm: 'gzip',
      asset: '[path].gz[query]',
      minRatio: 999,
      test: /\.html$/,
      threshold: 0
    })
  ]
};
