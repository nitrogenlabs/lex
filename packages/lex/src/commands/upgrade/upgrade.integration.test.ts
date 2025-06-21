/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {jest} from '@jest/globals';
import {compareVersions} from 'compare-versions';
import {execa} from 'execa';
import latestVersion from 'latest-version';

import {upgrade, UpgradeCallback} from './upgrade.js';
import {LexConfig} from '../../LexConfig.js';

jest.mock('execa');
jest.mock('latest-version');
jest.mock('compare-versions');
jest.mock('../../LexConfig.js');

describe('upgrade.integration', () => {
  const mockExit = jest.fn() as jest.MockedFunction<UpgradeCallback>;
  const mockExeca = execa as jest.MockedFunction<typeof execa>;
  const mockLatestVersion = latestVersion as jest.MockedFunction<typeof latestVersion>;
  const mockCompareVersions = compareVersions as jest.MockedFunction<typeof compareVersions>;
  const mockLexConfig = LexConfig as jest.Mocked<typeof LexConfig>;

  beforeEach(() => {
    mockExit.mockClear();
    mockExeca.mockClear();
    mockLatestVersion.mockClear();
    mockCompareVersions.mockClear();
    mockExeca.mockResolvedValue({} as any);
    mockLatestVersion.mockResolvedValue('1.0.0');
    mockLexConfig.parseConfig.mockResolvedValue(undefined);
    mockLexConfig.config = {} as any;
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