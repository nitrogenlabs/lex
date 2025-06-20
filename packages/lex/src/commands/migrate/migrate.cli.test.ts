/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';

import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as log from '../../utils/log.js';
import {migrate, MigrateOptions} from './migrate.js';

// Mock dependencies
jest.mock('execa');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/log.js');

describe('migrate.cli tests', () => {
  let mockCallback: jest.Mock<void, [number]>;
  let mockSpinner: {
    start: jest.Mock;
    succeed: jest.Mock;
    fail: jest.Mock;
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock process.cwd()
    process.cwd = jest.fn().mockReturnValue('/test/dir');
    
    // Mock spinner
    mockSpinner = {
      start: jest.fn(),
      succeed: jest.fn(),
      fail: jest.fn()
    };
    (app.createSpinner as jest.Mock).mockReturnValue(mockSpinner);
    
    // Mock app utils
    jest.spyOn(app, 'removeModules').mockResolvedValue(undefined);
    (app.getPackageJson as jest.Mock).mockReturnValue({
      dependencies: {
        'test-dep': '1.0.0',
        'webpack': '5.0.0'
      },
      devDependencies: {
        'jest': '27.0.0',
        'test-dev-dep': '2.0.0'
      }
    });
    (app.removeConflictModules as jest.Mock).mockImplementation((deps) => {
      // Simple mock implementation that removes webpack and jest
      const result = {...deps};
      delete result.webpack;
      delete result.jest;
      return result;
    });
    
    // Mock execa
    (execa as unknown as jest.Mock).mockResolvedValue({
      stdout: 'execa output',
      stderr: ''
    });
    
    // Mock LexConfig
    LexConfig.config = {
      packageManager: 'npm'
    };
    
    // Mock callback
    mockCallback = jest.fn<void, [number]>();
  });
  
  it('should migrate with default options', async () => {
    const options: MigrateOptions = {};
    
    const result = await migrate(options, mockCallback as unknown as typeof process.exit);
    
    expect(mockSpinner.start).toHaveBeenCalledWith('Removing node modules...');
    expect(app.removeModules).toHaveBeenCalled();
    expect(app.getPackageJson).toHaveBeenCalledWith('/test/dir/package.json');
    expect(app.removeConflictModules).toHaveBeenCalledTimes(2);
    expect(execa).toHaveBeenCalledWith(
      'npm',
      ['install'],
      expect.objectContaining({
        encoding: 'utf8',
        stdio: 'inherit'
      })
    );
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Successfully migrated app!');
    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });
  
  it('should use custom CLI name when provided', async () => {
    const options: MigrateOptions = {
      cliName: 'CustomCLI'
    };
    
    // Mock execa to throw an error to test error handling
    (execa as unknown as jest.Mock).mockRejectedValueOnce(new Error('Install failed'));
    
    await migrate(options, mockCallback as unknown as typeof process.exit);
    
    expect(log.log).toHaveBeenCalledWith('\nCustomCLI Error: Install failed', 'error', undefined);
  });
  
  it('should use custom package manager when provided', async () => {
    const options: MigrateOptions = {
      packageManager: 'yarn'
    };
    
    await migrate(options, mockCallback as unknown as typeof process.exit);
    
    expect(execa).toHaveBeenCalledWith(
      'yarn',
      ['install'],
      expect.any(Object)
    );
  });
  
  it('should use package manager from config when not provided in options', async () => {
    const options: MigrateOptions = {};
    
    LexConfig.config = {
      packageManager: 'npm'
    };
    
    await migrate(options, mockCallback as unknown as typeof process.exit);
    
    expect(execa).toHaveBeenCalledWith(
      'npm',
      ['install'],
      expect.any(Object)
    );
  });
  
  it('should respect quiet option', async () => {
    const options: MigrateOptions = {
      quiet: true
    };
    
    await migrate(options, mockCallback as unknown as typeof process.exit);
    
    expect(app.createSpinner).toHaveBeenCalledWith(true);
  });
  
  it('should handle installation errors', async () => {
    const options: MigrateOptions = {};
    
    // Mock execa to throw an error
    (execa as unknown as jest.Mock).mockRejectedValueOnce(new Error('Install failed'));
    
    const result = await migrate(options, mockCallback as unknown as typeof process.exit);
    
    expect(log.log).toHaveBeenCalledWith('\nLex Error: Install failed', 'error', undefined);
    expect(mockSpinner.fail).toHaveBeenCalledWith('Failed to remove modules.');
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });
  
  it('should work with process.exit as default callback', async () => {
    const options: MigrateOptions = {};
    
    // Save original process.exit
    const originalExit = process.exit;
    
    // Mock process.exit
    process.exit = jest.fn() as unknown as typeof process.exit;
    
    try {
      await migrate(options);
      
      expect(process.exit).toHaveBeenCalledWith(0);
    } finally {
      // Restore original process.exit
      process.exit = originalExit;
    }
  });
}); 