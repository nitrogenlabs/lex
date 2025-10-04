import {compareVersions} from 'compare-versions';
import {execa} from 'execa';
import latestVersion from 'latest-version';

import {upgrade, UpgradeCallback} from './upgrade.js';

jest.mock('execa');
jest.mock('latest-version');
jest.mock('compare-versions');
jest.mock('glob', () => ({
  sync: jest.fn(() => [])
}));
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => JSON.stringify({
    dependencies: {
      '@swc/core': '1.0.0',
      jest: '27.0.0',
      typescript: '4.0.0'
    },
    version: '0.9.0'
  }))
}));
jest.mock('../../utils/file.js', () => ({
  getLexPackageJsonPath: jest.fn(() => '/mock/path/package.json')
}));
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn()
  }))
}));

describe('upgrade.cli', () => {
  const mockExit = jest.fn() as unknown as jest.MockedFunction<UpgradeCallback>;
  const mockExeca = execa as jest.MockedFunction<typeof execa>;
  const mockLatestVersion = latestVersion as jest.MockedFunction<typeof latestVersion>;
  const mockCompareVersions = compareVersions as jest.MockedFunction<typeof compareVersions>;

  beforeEach(() => {
    mockExit.mockClear();
    mockExeca.mockClear();
    mockLatestVersion.mockClear();
    mockCompareVersions.mockClear();
    mockLatestVersion.mockResolvedValue('1.0.0');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should upgrade when newer version is available', async () => {
    mockCompareVersions.mockReturnValue(1); // latest > current

    await upgrade({}, mockExit);

    expect(mockExeca).toHaveBeenCalledWith('npm', ['install', '-g', '@nlabs/lex@latest'], expect.any(Object));
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should not upgrade when current version is latest', async () => {
    mockCompareVersions.mockReturnValue(0); // latest = current

    await upgrade({}, mockExit);

    expect(mockExeca).not.toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should use custom cliPackage when provided', async () => {
    mockCompareVersions.mockReturnValue(1); // latest > current

    await upgrade({cliPackage: '@custom/cli'}, mockExit);

    expect(mockExeca).toHaveBeenCalledWith('npm', ['install', '-g', '@custom/cli@latest'], expect.any(Object));
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should handle errors', async () => {
    mockLatestVersion.mockRejectedValueOnce(new Error('Failed to get latest version'));

    await upgrade({}, mockExit);

    expect(mockExit).toHaveBeenCalledWith(1);
  });
});