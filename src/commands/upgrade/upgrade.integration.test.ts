import {compareVersions} from 'compare-versions';
import {execa} from 'execa';
import latestVersion from 'latest-version';


import {upgrade, UpgradeCallback} from './upgrade.js';
import {LexConfig} from '../../LexConfig.js';

vi.mock('execa');
vi.mock('../../LexConfig.js');
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  createSpinner: vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn()
  }))
}));
vi.mock('compare-versions');
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
vi.mock('glob', async () => ({
  sync: vi.fn(() => [])
}));

describe('upgrade.integration', () => {
  const mockExit = vi.fn() as unknown as MockedFunction<UpgradeCallback>;
  const mockLatestVersion = latestVersion as MockedFunction<typeof latestVersion>;
  const mockCompareVersions = compareVersions as MockedFunction<typeof compareVersions>;
  const mockLexConfig = vi.mocked(LexConfig);

  beforeEach(() => {
    mockExit.mockClear();
    (execa as unknown as MockedFunction<typeof execa>).mockClear();
    mockLatestVersion.mockClear();
    mockCompareVersions.mockClear();
    mockLatestVersion.mockResolvedValue('1.0.0');
    mockLexConfig.parseConfig.mockResolvedValue(undefined);
    mockLexConfig.config = {} as any;
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('should parse config before checking version', async () => {
    mockCompareVersions.mockReturnValue(0);

    await upgrade({}, mockExit);

    expect(mockLexConfig.parseConfig).toHaveBeenCalled();
    expect(mockLatestVersion).toHaveBeenCalled();
  });

  it('should return 0 when up to date', async () => {
    mockCompareVersions.mockReturnValue(0);

    const result = await upgrade({}, mockExit);

    expect(result).toBe(0);
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should return 0 after successful upgrade', async () => {
    mockCompareVersions.mockReturnValue(1);

    const result = await upgrade({}, mockExit);

    expect(result).toBe(0);
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should return 1 on error', async () => {
    mockLatestVersion.mockRejectedValueOnce(new Error('Failed to get latest version'));

    const result = await upgrade({}, mockExit);

    expect(result).toBe(1);
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
