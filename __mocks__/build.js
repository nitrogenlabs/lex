// Mock implementation of build module
const mockSpinner = {
  start: vi.fn(),
  succeed: vi.fn(),
  fail: vi.fn()
};

const build = vi.fn().mockResolvedValue(0);
const buildWithEsBuild = vi.fn().mockResolvedValue(0);
const buildWithWebpack = vi.fn().mockResolvedValue(0);

module.exports = {
  build,
  buildWithEsBuild,
  buildWithWebpack
};