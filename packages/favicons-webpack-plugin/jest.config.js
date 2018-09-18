const base = require('../../jest.config.base.js');
const pack = require('./package');

module.exports = {
  ...base,
  displayName: pack.name,
  // moduleDirectories: ['../../node_modules', './node_modules'],
  // modulePaths: [
  //   '../../node_modules',
  //   './node_modules'
  // ],
  name: pack.name,
  rootDir: '../..',
  testMatch: ['<rootDir>/packages/favicons-webpack-plugin/**/*.test.ts']
};
