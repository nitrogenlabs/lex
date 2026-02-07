// Mock implementation of versions module
const jsonVersions = vi.fn().mockResolvedValue({});
const packages = vi.fn().mockResolvedValue([]);
const parseVersion = vi.fn().mockReturnValue('1.0.0');
const versions = vi.fn().mockResolvedValue(undefined);

module.exports = {
  jsonVersions,
  packages,
  parseVersion,
  versions
};