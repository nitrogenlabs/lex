const cwd = process.cwd();
const path = require('path');
const lexConfig = JSON.parse(process.env.LEX_CONFIG);
const {sourceDir} = lexConfig;
const lexNodePath = path.resolve(__dirname, './node_modules');
const sourcePath = path.resolve(`${cwd}/${sourceDir}`);
const {useTypescript} = lexConfig;

if(useTypescript) {
  testRegex = '(/__tests__/.*|(\\.|/)(test|spec))\\.(ts|tsx)?$';
} else {
  testRegex = '(/__tests__/.*|(\\.|/)(test|spec))\\.(js)?$';
}

module.exports = {
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coveragePathIgnorePatterns: ['/node_modules/'],
  coverageReporters: ['html', 'text'],
  moduleDirectories: [
    './node_modules',
    lexNodePath,
    sourcePath
  ],
  moduleFileExtensions: ['js', 'ts', 'tsx'],
  moduleNameMapper: {
    '\\.(css|jpg|png|svg)$': path.resolve(__dirname, './dist/emptyModule')
  },
  resolver: path.resolve(__dirname, './dist/resolver.js'),
  rootDir: cwd,
  setupFiles: [`${lexNodePath}/regenerator-runtime/runtime.js`],
  testPathIgnorePatterns: [
    '/node_modules/',
    `${lexNodePath}/`
  ],
  testRegex,
  testURL: 'http://localhost',
  transform: {'.(js|jsx|ts|tsx)': path.resolve(__dirname, './jest.preprocessor.js')},
  verbose: true
};
