// Mock implementation of compile module
const compile = jest.fn().mockResolvedValue(0);
const hasFileType = jest.fn().mockReturnValue(false);

module.exports = {
  compile,
  hasFileType
};