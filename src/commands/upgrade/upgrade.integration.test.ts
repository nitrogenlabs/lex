import {compareVersions} from 'compare-versions';
import {execa} from 'execa';
import latestVersion from 'latest-version';


import {upgrade, UpgradeCallback} from './upgrade.js';
import {LexConfig} from '../../LexConfig.js';

jest.mock('execa');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn()
  }))
}));
jest.mock('compare-versions');
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => JSON.stringify({
    dependencies: {
      esbuild: '1.0.0',
      jest: '27.0.0',
      typescript: '4.0.0'
    },
    version: '0.9.0'
  }))
}));
jest.mock('../../utils/file.js', () => ({
  getLexPackageJsonPath: jest.fn(() => '/mock/path/package.json')
}));
jest.mock('glob', () => ({
  sync: jest.fn(() => [])
}));

describe('upgrade.integration', () => {
  const mockExit = jest.fn() as unknown as jest.MockedFunction<UpgradeCallback>;
  const mockLatestVersion = latestVersion as jest.MockedFunction<typeof latestVersion>;
  const mockCompareVersions = compareVersions as jest.MockedFunction<typeof compareVersions>;
  const mockLexConfig = LexConfig as jest.Mocked<typeof LexConfig>;

  beforeEach(() => {
    mockExit.mockClear();
    (execa as unknown as jest.MockedFunction<typeof execa>).mockClear();
    mockLatestVersion.mockClear();
    mockCompareVersions.mockClear();
    mockLatestVersion.mockResolvedValue('1.0.0');
    mockLexConfig.parseConfig.mockResolvedValue(undefined);
    mockLexConfig.config = {} as any;
  });

  afterAll(() => {
    jest.restoreAllMocks();
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