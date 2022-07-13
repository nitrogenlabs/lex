const hq = require('alias-hq');

module.exports = {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
  moduleNameMapper: hq.get('jest'),
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/types/'],
  transform: {
    '\\.[jt]sx?$':  ['esbuild-jest', {
      loaders: {
        '.spec.js': 'jsx',
        '.js': 'jsx'
      }
    }
    ]
  }
};