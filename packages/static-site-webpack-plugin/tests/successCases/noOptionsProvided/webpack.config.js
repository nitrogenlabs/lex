const {StatsWriterPlugin} = require('webpack-stats-plugin');

const {StaticSitePlugin} = require('../../../src');

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
    new StaticSitePlugin(),
    new StatsWriterPlugin() // Causes the asset's `size` method to be called
  ]
};
