const ejs = require('ejs');
const fs = require('fs');
const {StatsWriterPlugin} = require('webpack-stats-plugin');

const {StaticSitePlugin} = require('../../../src/index');

const template = ejs.compile(fs.readFileSync(`${__dirname}/template.ejs`, 'utf-8'));
const paths = [
  '/',
  '/foo',
  '/foo/bar'
];

module.exports = {
  entry: {
    CUSTOM_NAME: `${__dirname}/index.js`
  },
  mode: 'production',
  output: {
    filename: 'index.js',
    libraryTarget: 'umd',
    path: `${__dirname}/actualOutput`
  },
  plugins: [
    new StaticSitePlugin({
      entry: 'CUSTOM_NAME',
      locals: {
        template
      },
      paths
    }),
    new StatsWriterPlugin() // Causes the asset's `size` method to be called
  ]
};
