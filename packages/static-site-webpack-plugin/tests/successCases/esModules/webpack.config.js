const ejs = require('ejs');
const fs = require('fs');

const {StaticSitePlugin} = require('../../../src');

const template = ejs.compile(fs.readFileSync(`${__dirname}/template.ejs`, 'utf-8'));
const paths = [
  '/',
  '/foo',
  '/foo/bar'
];

module.exports = {
  devtool: 'source-map',
  entry: {
    index:`${__dirname}/index.js`
  },
  mode: 'production',
  module: {
    rules: [
      {
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['env']
        },
        test: /\.js$/
      }
    ]
  },
  output: {
    filename: 'index.js',
    libraryTarget: 'umd',
    path: `${__dirname}/actualOutput`,
    publicPath: '/'
  },
  plugins: [
    new StaticSitePlugin({
      locals: {
        template
      },
      paths
    })
  ]
};
