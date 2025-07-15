/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {jest} from '@jest/globals';

import {jsonVersions, packages, parseVersion, versions} from './versions.js';
import {log} from '../../utils/log.js';

jest.mock('../../utils/log.js');

describe('versions.integration', () => {
  const mockExit = jest.fn();
  const mockLog = log as jest.MockedFunction<typeof log>;
  const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

  beforeEach(() => {
    mockExit.mockClear();
    mockLog.mockClear();
    mockConsoleLog.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  it('should parse version correctly', () => {
    expect(parseVersion('^1.0.0')).toBe('1.0.0');
    expect(parseVersion('1.0.0')).toBe('1.0.0');
    expect(parseVersion('^1.2.3')).toBe('1.2.3');
    expect(parseVersion(undefined)).toBe(undefined);
  });

  it('should create JSON versions correctly', () => {
    const mockPackages = {
      test1: '1.0.0',
      test2: '2.0.0'
    };

    const result = jsonVersions(mockPackages);

    expect(result).toEqual({
      test1: mockPackages.test1,
      test2: mockPackages.test2
    });
  });

  it('should log versions in text format', async () => {
    await versions({}, mockExit);

    expect(mockLog).toHaveBeenCalledWith('Versions:', 'info', false);
    expect(mockLog).toHaveBeenCalledWith(`  Lex: ${packages.lex}`, 'info', false);
    expect(mockLog).toHaveBeenCalledWith('  ----------', 'note', false);
    expect(mockLog).toHaveBeenCalledWith(`  ESBuild: ${packages.esbuild}`, 'info', false);
    expect(mockLog).toHaveBeenCalledWith(`  Jest: ${packages.jest}`, 'info', false);
    expect(mockLog).toHaveBeenCalledWith(`  Typescript: ${packages.typescript}`, 'info', false);
    expect(mockLog).toHaveBeenCalledWith(`  Webpack: ${packages.webpack}`, 'info', false);
  });
});