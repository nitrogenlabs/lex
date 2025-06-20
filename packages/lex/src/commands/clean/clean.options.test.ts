/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import * as app from '../../utils/app.js';
import * as log from '../../utils/log.js';
import { LexConfig } from '../../LexConfig.js';
import { clean, CleanOptions } from './clean.js';

// Mock dependencies
jest.mock('../../utils/app.js');
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js');

describe('clean.options tests', () => {
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
  
  it('should respect quiet option', async () => {
    const options: CleanOptions = {
      quiet: true
    };
    
    await clean(options, mockCallback);
    
    // Should create spinner with quiet=true
    expect(app.createSpinner).toHaveBeenCalledWith(true);
    
    // Should log with quiet=true
    expect(log.log).toHaveBeenCalledWith('Lex cleaning directory...', 'info', true);
  });
  
  it('should respect snapshots option when true', async () => {
    const options: CleanOptions = {
      quiet: false,
      snapshots: true
    };
    
    await clean(options, mockCallback);
    
    // Should remove snapshots
    expect(app.removeFiles).toHaveBeenCalledWith('./**/__snapshots__', true);
  });
  
  it('should respect snapshots option when false', async () => {
    const options: CleanOptions = {
      quiet: false,
      snapshots: false
    };
    
    await clean(options, mockCallback);
    
    // Should not remove snapshots
    expect(app.removeFiles).not.toHaveBeenCalledWith('./**/__snapshots__', true);
  });
  
  it('should respect snapshots option when undefined', async () => {
    const options: CleanOptions = {
      quiet: false
    };
    
    await clean(options, mockCallback);
    
    // Should not remove snapshots
    expect(app.removeFiles).not.toHaveBeenCalledWith('./**/__snapshots__', true);
  });
  
  it('should use custom CLI name when provided', async () => {
    const customName = 'CustomCLI';
    const options: CleanOptions = {
      cliName: customName,
      quiet: false
    };
    
    await clean(options, mockCallback);
    
    // Should use custom name in logs
    expect(log.log).toHaveBeenCalledWith(`${customName} cleaning directory...`, 'info', false);
    
    // Should use custom name in error messages if there was an error
    (app.removeModules as jest.Mock).mockRejectedValueOnce(new Error('Test error'));
    
    await clean(options, mockCallback);
    
    expect(log.log).toHaveBeenCalledWith(`\n${customName} Error: Test error`, 'error', false);
  });
  
  it('should use default CLI name when not provided', async () => {
    const options: CleanOptions = {
      quiet: false
    };
    
    await clean(options, mockCallback);
    
    // Should use default name in logs
    expect(log.log).toHaveBeenCalledWith('Lex cleaning directory...', 'info', false);
  });
  
  it('should pass options to LexConfig.parseConfig', async () => {
    const options: CleanOptions = {
      cliName: 'TestCLI',
      quiet: true,
      snapshots: true
    };
    
    await clean(options, mockCallback);
    
    // Should pass all options to parseConfig
    expect(LexConfig.parseConfig).toHaveBeenCalledWith(options);
  });
}); 