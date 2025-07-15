// Mock implementation of build module
const mockSpinner = {
  start: jest.fn(),
  succeed: jest.fn(),
  fail: jest.fn()
};

const build = jest.fn().mockResolvedValue(0);
const buildWithEsBuild = jest.fn().mockResolvedValue(0);
const buildWithWebpack = jest.fn().mockResolvedValue(0);

module.exports = {
  build,
  buildWithEsBuild,
  buildWithWebpack
};