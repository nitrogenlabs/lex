/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {jest} from '@jest/globals';

import {jsonVersions, packages, versions} from './versions.js';

jest.mock('../../utils/log.js');

describe('versions.cli', () => {
  const mockExit = jest.fn();
  const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

  beforeEach(() => {
    mockExit.mockClear();
    mockConsoleLog.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  it('should display versions in text format by default', async () => {
    await versions({}, mockExit);
    
    expect(mockConsoleLog).not.toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should display versions in JSON format when json option is true', async () => {
    await versions({json: true}, mockExit);
    
    expect(mockConsoleLog).toHaveBeenCalledWith(JSON.stringify(jsonVersions(packages)));
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should return 0 as exit code', async () => {
    const result = await versions({}, mockExit);
    
    expect(result).toBe(0);
    expect(mockExit).toHaveBeenCalledWith(0);
  });
}); 