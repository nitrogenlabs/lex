import {compareVersions} from 'compare-versions';
import {execa} from 'execa';
import latestVersion from 'latest-version';

import {upgrade, UpgradeCallback} from './upgrade.js';

vi.mock('execa');
vi.mock('latest-version');
vi.mock('compare-versions');
vi.mock('glob', async () => ({
  sync: vi.fn(() => [])
}));
vi.mock('fs', async () => ({
  existsSync: vi.fn(() => true),
  readFileSync: vi.fn(() => JSON.stringify({
    dependencies: {
      '@swc/core': '1.0.0',
      typescript: '4.0.0',
      vitest: '4.0.0'
    },
    version: '0.9.0'
  }))
}));
vi.mock('../../utils/file.js', async () => ({
  getLexPackageJsonPath: vi.fn(() => '/mock/path/package.json')
}));
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  createSpinner: vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn()
  }))
}));

describe('upgrade.cli', () => {
  const mockExit = vi.fn() as unknown as MockedFunction<UpgradeCallback>;
  const mockExeca = execa as MockedFunction<typeof execa>;
  const mockLatestVersion = latestVersion as MockedFunction<typeof latestVersion>;
  const mockCompareVersions = compareVersions as MockedFunction<typeof compareVersions>;

  beforeEach(() => {
    mockExit.mockClear();
    mockExeca.mockClear();
    mockLatestVersion.mockClear();
    mockCompareVersions.mockClear();
    mockLatestVersion.mockResolvedValue('1.0.0');
  });

  afterAll(() => {
    vi.restoreAllMocks();
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
