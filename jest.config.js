const cwd = process.cwd();
const path = require('path');

const {sourceFullPath} = JSON.parse(process.env.LEX_CONFIG || '{}');
const lexNodePath = path.resolve(__dirname, './node_modules');

module.exports = {
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coveragePathIgnorePatterns: ['/node_modules/'],
  coverageReporters: ['html', 'text'],
  moduleDirectories: [
    'node_modules'
  ],
  moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
  moduleNameMapper: {
    '\\.(css|jpg|png|svg|txt)$': path.resolve(__dirname, './dist/emptyModule')
  },
  modulePaths: [
    `${cwd}/node_modules`,
    lexNodePath,
    sourceFullPath
  ],
  resolver: path.resolve(__dirname, './dist/resolver.js'),
  rootDir: cwd,
  setupFiles: [`${lexNodePath}/@babel/polyfill/dist/polyfill.js`],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '/node_modules/',
    `${lexNodePath}/`
  ],
  testRegex: '(/__tests__/.*|\\.(test|spec))\\.(js|ts|tsx)?$',
  testURL: 'http://localhost',
  transform: {'\\.(js|ts|tsx)$': path.resolve(__dirname, './jest.preprocessor.js')},
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$'
  ]
};
