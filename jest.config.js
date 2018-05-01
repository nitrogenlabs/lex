const lexConfig = JSON.parse(process.env.LEX_CONFIG);
const cwd = process.cwd();
const path = require('path');
const lexNodePath = path.resolve(__dirname, './node_modules');
const sourcePath = path.resolve(`${cwd}/${lexConfig.sourceDir}`);

module.exports = {
  "collectCoverage": true,
  "coverageDirectory": "<rootDir>/coverage",
  "coveragePathIgnorePatterns": [
    "/node_modules/"
  ],
  "coverageReporters": [
    "html",
    "text"
  ],
  "moduleDirectories": [
    "./node_modules",
    lexNodePath,
    sourcePath
  ],
  "moduleFileExtensions": [
    "js",
    "ts",
    "tsx"
  ],
  "moduleNameMapper": {
    "\\.(css|jpg|png|svg)$": path.resolve(__dirname, './lib/emptyModule')
  },
  "resolver": path.resolve(__dirname, './lib/resolver.js'),
  "rootDir": cwd,
  "testPathIgnorePatterns": [
    "/node_modules/",
    `/${lexNodePath}/`
  ],
  "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.(js|ts|tsx)?$",
  "testURL": "http://localhost",
  "transform": {
    ".(js|jsx|ts|tsx)": `${lexNodePath}/ts-jest-babel-7`
  },
  "verbose": true
};
