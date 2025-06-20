/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';

import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as log from '../../utils/log.js';
import {migrate} from './migrate.js';

// Mock dependencies
jest.mock('execa');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/log.js');

describe('migrate.integration tests', () => {
  let mockSpinner: {
    start: jest.Mock;
    succeed: jest.Mock;
    fail: jest.Mock;
  };
  let mockExit: jest.Mock<void, [number]>;
  
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
    
    // Mock exit callback
    mockExit = jest.fn<void, [number]>();
  });
  
  it('should execute the full migration workflow', async () => {
    // Setup the test
    const options = {
      quiet: false
    };
    
    // Execute the command
    const result = await migrate(options, mockExit as unknown as typeof process.exit);
    
    // Verify the workflow steps were executed in order
    expect(mockSpinner.start).toHaveBeenCalledWith('Removing node modules...');
    expect(app.removeModules).toHaveBeenCalled();
    expect(app.getPackageJson).toHaveBeenCalledWith('/test/dir/package.json');
    
    // Verify conflict modules were removed
    expect(app.removeConflictModules).toHaveBeenCalledTimes(2);
    
    // Verify dependencies were installed
    expect(execa).toHaveBeenCalledWith(
      'npm',
      ['install'],
      expect.objectContaining({
        encoding: 'utf8',
        stdio: 'inherit'
      })
    );
    
    // Verify success message
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Successfully migrated app!');
    expect(result).toBe(0);
    expect(mockExit).toHaveBeenCalledWith(0);
  });
  
  it('should handle installation errors gracefully', async () => {
    // Setup the test
    const options = {
      quiet: false
    };
    
    // Mock installation failure
    (execa as unknown as jest.Mock).mockRejectedValueOnce(new Error('Install failed'));
    
    // Execute the command
    const result = await migrate(options, mockExit as unknown as typeof process.exit);
    
    // Verify error handling
    expect(log.log).toHaveBeenCalledWith('\nLex Error: Install failed', 'error', false);
    expect(mockSpinner.fail).toHaveBeenCalledWith('Failed to remove modules.');
    expect(result).toBe(1);
    expect(mockExit).toHaveBeenCalledWith(1);
  });
}); 