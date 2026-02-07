// Mock implementation of compile module
const compile = vi.fn().mockResolvedValue(0);
const hasFileType = vi.fn().mockReturnValue(false);

module.exports = {
  compile,
  hasFileType
};