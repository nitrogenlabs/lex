const ejs = require('ejs');
const fs = require('fs');

const {StaticSitePlugin} = require('../../../src');

const templateSource = fs.readFileSync(`${__dirname}/template.ejs`, 'utf-8');
const template = ejs.compile(templateSource);

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
      crawl: true,
      locals: {
        template
      }
    })
  ]
};
