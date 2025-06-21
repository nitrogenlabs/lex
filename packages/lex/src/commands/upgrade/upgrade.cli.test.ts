/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {jest} from '@jest/globals';
import {compareVersions} from 'compare-versions';
import {execa} from 'execa';
import latestVersion from 'latest-version';

import {upgrade, UpgradeCallback} from './upgrade.js';

jest.mock('execa');
jest.mock('latest-version');
jest.mock('compare-versions');

describe('upgrade.cli', () => {
  const mockExit = jest.fn() as jest.MockedFunction<UpgradeCallback>;
  const mockExeca = execa as jest.MockedFunction<typeof execa>;
  const mockLatestVersion = latestVersion as jest.MockedFunction<typeof latestVersion>;
  const mockCompareVersions = compareVersions as jest.MockedFunction<typeof compareVersions>;

  beforeEach(() => {
    mockExit.mockClear();
    mockExeca.mockClear();
    mockLatestVersion.mockClear();
    mockCompareVersions.mockClear();
    mockExeca.mockResolvedValue({} as any);
    mockLatestVersion.mockResolvedValue('1.0.0');
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