// Mock implementation of versions module
const jsonVersions = jest.fn().mockResolvedValue({});
const packages = jest.fn().mockResolvedValue([]);
const parseVersion = jest.fn().mockReturnValue('1.0.0');
const versions = jest.fn().mockResolvedValue(undefined);

module.exports = {
  jsonVersions,
  packages,
  parseVersion,
  versions
};