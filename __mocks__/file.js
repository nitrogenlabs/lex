const fs = require('fs');
const path = require('path');

// Mock implementations that don't use import.meta.url
function getDirName() {
  return process.cwd();
}

function getFilePath(relativePath) {
  // For testing, resolve relative to process.cwd()
  return path.resolve(process.cwd(), relativePath);
}

function getLexPackageJsonPath() {
  // For testing, return a mock path
  return path.resolve(process.cwd(), 'package.json');
}

function relativeFilePath(filename, dirPath = './', backUp = 0) {
  // Mock implementation
  return path.resolve(process.cwd(), filename);
}

function relativeNodePath(filename, dirPath = './', backUp = 0) {
  // Mock implementation
  return path.resolve(process.cwd(), `node_modules/${filename}`);
}

function getNodePath(moduleName) {
  // Mock implementation
  return path.resolve(process.cwd(), `node_modules/${moduleName}`);
}

function resolveBinaryPath(binaryName, packageName) {
  // Mock implementation
  if(packageName) {
    return path.resolve(process.cwd(), `node_modules/${packageName}/bin/${binaryName}`);
  }
  return path.resolve(process.cwd(), `node_modules/.bin/${binaryName}`);
}

module.exports = {
  getDirName,
  getFilePath,
  getLexPackageJsonPath,
  relativeFilePath,
  relativeNodePath,
  getNodePath,
  resolveBinaryPath
};