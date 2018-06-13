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
    './node_modules',
    lexNodePath,
    sourceFullPath
  ],
  moduleFileExtensions: ['js', 'ts', 'tsx'],
  moduleNameMapper: {
    '\\.(css|jpg|png|svg|txt)$': path.resolve(__dirname, './dist/emptyModule')
  },
  resolver: path.resolve(__dirname, './dist/resolver.js'),
  rootDir: cwd,
  setupFiles: [`${lexNodePath}/regenerator-runtime/runtime.js`],
  testPathIgnorePatterns: [
    '/node_modules/',
    `${lexNodePath}/`
  ],
  testRegex: '(/__tests__/.*|\\.(test|spec))\\.(js|ts|tsx)?$',
  testURL: 'http://localhost',
  transform: {'.(js|jsx|ts|tsx)': path.resolve(__dirname, './jest.preprocessor.js')}
};
