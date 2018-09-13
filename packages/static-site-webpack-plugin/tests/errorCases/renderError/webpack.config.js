const {StaticSitePlugin} = require('../../../src/index');

module.exports = {
  entry: {
    main: `${__dirname}/index.js`
  },

  output: {
    filename: 'index.js',
    libraryTarget: 'umd',
    path: `${__dirname}/actualOutput`,
    publicPath: '/'
  },

  plugins: [
    new StaticSitePlugin('main', ['/'])
  ]
};
