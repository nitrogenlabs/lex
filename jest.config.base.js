module.exports = {
  collectCoverage: true,
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '(tests/.*.mock).(jsx?|tsx?)$'
  ],
  coverageReporters: ['html', 'text'],
  moduleDirectories: [
    // '../node_modules',
    './node_modules'
  ],
  moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
  // moduleNameMapper: {'\\.(css|jpg|png|svg|txt)$': './emptyModule'},
  modulePaths: [
    // '../node_modules',
    'node_modules'
  ],
  // roots: [
  //   '<rootDir>/src',
  //   '<rootDir>/tests'
  // ],
  testEnvironment: 'jsdom',
  // testPathIgnorePatterns: [
  //   '/node_modules/'
  // ],
  // testRegex: '(/tests/.*.(test|spec)).(jsx?|tsx?)$',
  testURL: 'http://localhost',
  transform: {'^.+\\.ts$': 'ts-jest'},
  transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$'],
  verbose: true
};
