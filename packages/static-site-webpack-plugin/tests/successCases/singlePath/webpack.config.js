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
    path: `${__dirname}/actualOutput`,
    publicPath: '/'
  },
  plugins: [
    new StaticSitePlugin({
      locals: {
        template
      },
      paths: '/'
    })
  ]
};
