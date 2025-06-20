/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import * as app from '../../utils/app.js';
import { LexConfig } from '../../LexConfig.js';
import { clean, CleanOptions } from './clean.js';

// Mock dependencies
jest.mock('../../utils/app.js');
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js');

describe('clean integration tests', () => {
  let mockSpinner: any;
  let mockCallback: jest.Mock;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock spinner
    mockSpinner = {
      start: jest.fn(),
      succeed: jest.fn(),
      fail: jest.fn()
    };
    (app.createSpinner as jest.Mock).mockReturnValue(mockSpinner);
    
    // Mock LexConfig
    (LexConfig.parseConfig as jest.Mock).mockResolvedValue({});
    
    // Mock app utilities
    (app.removeModules as jest.Mock).mockResolvedValue(undefined);
    (app.removeFiles as jest.Mock).mockResolvedValue(undefined);
    
    // Mock callback
    mockCallback = jest.fn();
  });
  
  it('should clean all specified files and directories', async () => {
    const options: CleanOptions = {
      quiet: false,
      snapshots: true
    };
    
    await clean(options, mockCallback);
    
    // Verify all cleaning operations were called
    expect(app.removeModules).toHaveBeenCalledTimes(1);
    expect(app.removeFiles).toHaveBeenCalledWith('./coverage', true);
    expect(app.removeFiles).toHaveBeenCalledWith('./npm-debug.log', true);
    expect(app.removeFiles).toHaveBeenCalledWith('./**/__snapshots__', true);
  });
  
  it('should handle removeModules failure', async () => {
    const options: CleanOptions = {
      quiet: false
    };
    
    const errorMessage = 'Permission denied';
    (app.removeModules as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
    
    const result = await clean(options, mockCallback);
    
    expect(mockSpinner.fail).toHaveBeenCalledWith('Failed to clean project.');
    expect(result).toBe(1);
    
    // Verify no further cleaning operations were attempted
    expect(app.removeFiles).not.toHaveBeenCalled();
  });
  
  it('should handle removeFiles failure for coverage', async () => {
    const options: CleanOptions = {
      quiet: false
    };
    
    const errorMessage = 'Cannot remove directory';
    (app.removeFiles as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
    
    const result = await clean(options, mockCallback);
    
    expect(mockSpinner.fail).toHaveBeenCalledWith('Failed to clean project.');
    expect(result).toBe(1);
    
    // Verify only removeModules was called
    expect(app.removeModules).toHaveBeenCalledTimes(1);
    expect(app.removeFiles).toHaveBeenCalledTimes(1);
  });
  
  it('should handle removeFiles failure for npm logs', async () => {
    const options: CleanOptions = {
      quiet: false
    };
    
    // First call succeeds, second fails
    (app.removeFiles as jest.Mock)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Cannot remove log file'));
    
    const result = await clean(options, mockCallback);
    
    expect(mockSpinner.fail).toHaveBeenCalledWith('Failed to clean project.');
    expect(result).toBe(1);
    
    // Verify removeModules and first removeFiles were called
    expect(app.removeModules).toHaveBeenCalledTimes(1);
    expect(app.removeFiles).toHaveBeenCalledTimes(2);
  });
  
  it('should handle removeFiles failure for snapshots', async () => {
    const options: CleanOptions = {
      quiet: false,
      snapshots: true
    };
    
    // First two calls succeed, third fails
    (app.removeFiles as jest.Mock)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Cannot remove snapshots'));
    
    const result = await clean(options, mockCallback);
    
    expect(mockSpinner.fail).toHaveBeenCalledWith('Failed to clean project.');
    expect(result).toBe(1);
    
    // Verify all operations were attempted
    expect(app.removeModules).toHaveBeenCalledTimes(1);
    expect(app.removeFiles).toHaveBeenCalledTimes(3);
  });
  
  it('should parse LexConfig before cleaning', async () => {
    const options: CleanOptions = {
      quiet: false
    };
    
    await clean(options, mockCallback);
    
    // Verify LexConfig was parsed before any cleaning operations
    expect(LexConfig.parseConfig).toHaveBeenCalledWith(options);
    expect(LexConfig.parseConfig).toHaveBeenCalledTimes(1);
    
    // Verify the call order
    const parseConfigCall = (LexConfig.parseConfig as jest.Mock).mock.invocationCallOrder[0];
    const removeModulesCall = (app.removeModules as jest.Mock).mock.invocationCallOrder[0];
    
    expect(parseConfigCall).toBeLessThan(removeModulesCall);
  });
}); 