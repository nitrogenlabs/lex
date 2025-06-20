/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import semver from 'semver';

import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as log from '../../utils/log.js';
import {publish} from './publish.js';

// Mock dependencies
jest.mock('execa');
jest.mock('semver');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/log.js');

describe('publish.integration tests', () => {
  let mockExit: jest.Mock<void, [number]>;
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
    
    // Mock package.json operations
    (app.getPackageJson as jest.Mock).mockReturnValue({
      name: 'test-package',
      version: '1.0.0'
    });
    (app.setPackageJson as jest.Mock).mockImplementation(() => {});
    
    // Mock semver
    (semver.coerce as jest.Mock).mockImplementation((version) => version);
    (semver.valid as jest.Mock).mockReturnValue(true);
    (semver.inc as jest.Mock).mockImplementation((version, release) => {
      if (release === 'major') return '2.0.0';
      if (release === 'minor') return '1.1.0';
      if (release === 'patch') return '1.0.1';
      if (release === 'prerelease') return '1.0.1-alpha.0';
      return version;
    });
    
    // Mock execa
    (execa as unknown as jest.Mock).mockResolvedValue({
      stdout: 'execa output',
      stderr: ''
    });
    
    // Mock LexConfig
    LexConfig.parseConfig = jest.fn().mockResolvedValue(undefined);
    LexConfig.config = {
      packageManager: 'npm'
    };
    
    // Mock exit callback
    mockExit = jest.fn<void, [number]>();
  });
  
  it('should execute the full publish workflow with patch bump', async () => {
    // Setup the test
    const options = {
      bump: 'patch',
      quiet: false
    };
    
    // Execute the command
    const result = await publish(options, mockExit as unknown as typeof process.exit);
    
    // Verify the workflow steps were executed in order
    expect(log.log).toHaveBeenCalledWith('Lex publishing npm module...', 'info', false);
    expect(LexConfig.parseConfig).toHaveBeenCalledWith(options);
    expect(app.getPackageJson).toHaveBeenCalledWith('/test/dir/package.json');
    
    // Verify version was bumped correctly
    expect(semver.coerce).toHaveBeenCalledWith('1.0.0');
    expect(semver.valid).toHaveBeenCalledWith('1.0.0');
    expect(semver.inc).toHaveBeenCalledWith('1.0.0', 'patch');
    
    // Verify package.json was updated
    expect(app.setPackageJson).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test-package',
        version: '1.0.1'
      }),
      '/test/dir/package.json'
    );
    
    // Verify npm publish was called
    expect(execa).toHaveBeenCalledWith(
      'npm',
      ['publish'],
      expect.objectContaining({
        encoding: 'utf8',
        stdio: 'inherit'
      })
    );
    
    // Verify success message
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Successfully published npm package: test-package!');
    expect(result).toBe(0);
    expect(mockExit).toHaveBeenCalledWith(0);
  });
  
  it('should execute the full publish workflow with yarn and prerelease', async () => {
    // Setup the test
    const options = {
      bump: 'alpha',
      packageManager: 'yarn',
      quiet: false
    };
    
    // Execute the command
    const result = await publish(options, mockExit as unknown as typeof process.exit);
    
    // Verify the workflow steps were executed in order
    expect(log.log).toHaveBeenCalledWith('Lex publishing npm module...', 'info', false);
    expect(LexConfig.parseConfig).toHaveBeenCalledWith(options);
    expect(app.getPackageJson).toHaveBeenCalledWith('/test/dir/package.json');
    
    // Verify version was bumped correctly
    expect(semver.coerce).toHaveBeenCalledWith('1.0.0');
    expect(semver.valid).toHaveBeenCalledWith('1.0.0');
    expect(semver.inc).toHaveBeenCalledWith('1.0.0', 'prerelease', 'alpha');
    
    // Verify yarn publish was called with --new-version
    expect(execa).toHaveBeenCalledWith(
      'yarn',
      ['publish', '--new-version', '1.0.1-alpha.0'],
      expect.objectContaining({
        encoding: 'utf8',
        stdio: 'inherit'
      })
    );
    
    // Verify package.json was NOT updated (yarn handles this)
    expect(app.setPackageJson).not.toHaveBeenCalled();
    
    // Verify success message
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Successfully published npm package: test-package!');
    expect(result).toBe(0);
    expect(mockExit).toHaveBeenCalledWith(0);
  });
  
  it('should execute the full publish workflow with specific version', async () => {
    // Setup the test
    const options = {
      newVersion: '3.0.0',
      quiet: false
    };
    
    // Execute the command
    const result = await publish(options, mockExit as unknown as typeof process.exit);
    
    // Verify the workflow steps were executed in order
    expect(log.log).toHaveBeenCalledWith('Lex publishing npm module...', 'info', false);
    expect(LexConfig.parseConfig).toHaveBeenCalledWith(options);
    expect(app.getPackageJson).toHaveBeenCalledWith('/test/dir/package.json');
    
    // Verify semver functions were not called
    expect(semver.coerce).not.toHaveBeenCalled();
    expect(semver.valid).not.toHaveBeenCalled();
    expect(semver.inc).not.toHaveBeenCalled();
    
    // Verify package.json was updated
    expect(app.setPackageJson).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test-package',
        version: '3.0.0'
      }),
      '/test/dir/package.json'
    );
    
    // Verify npm publish was called
    expect(execa).toHaveBeenCalledWith(
      'npm',
      ['publish'],
      expect.objectContaining({
        encoding: 'utf8',
        stdio: 'inherit'
      })
    );
    
    // Verify success message
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Successfully published npm package: test-package!');
    expect(result).toBe(0);
    expect(mockExit).toHaveBeenCalledWith(0);
  });
  
  it('should handle package.json not found error', async () => {
    // Setup the test
    const options = {
      bump: 'patch',
      quiet: false
    };
    
    // Mock package.json not found
    (app.getPackageJson as jest.Mock).mockImplementationOnce(() => {
      throw new Error('File not found');
    });
    
    // Execute the command
    const result = await publish(options, mockExit as unknown as typeof process.exit);
    
    // Verify error handling
    expect(log.log).toHaveBeenCalledWith(
      expect.stringContaining('Error: The file'),
      'error',
      false
    );
    expect(log.log).toHaveBeenCalledWith('File not found', 'error');
    expect(result).toBe(1);
    expect(mockExit).toHaveBeenCalledWith(1);
  });
  
  it('should handle invalid version error', async () => {
    // Setup the test
    const options = {
      bump: 'patch',
      quiet: false
    };
    
    // Mock invalid version
    (semver.valid as jest.Mock).mockReturnValue(false);
    
    // Execute the command
    const result = await publish(options, mockExit as unknown as typeof process.exit);
    
    // Verify error handling
    expect(log.log).toHaveBeenCalledWith('\nLex Error: Version is invalid in package.json', 'error', false);
    expect(result).toBe(1);
    expect(mockExit).toHaveBeenCalledWith(1);
  });
  
  it('should handle publish error', async () => {
    // Setup the test
    const options = {
      bump: 'patch',
      quiet: false
    };
    
    // Mock publish failure
    (execa as unknown as jest.Mock).mockRejectedValueOnce(new Error('Publish failed'));
    
    // Execute the command
    const result = await publish(options, mockExit as unknown as typeof process.exit);
    
    // Verify error handling
    expect(log.log).toHaveBeenCalledWith('\nLex Error: Publish failed', 'error', false);
    expect(mockSpinner.fail).toHaveBeenCalledWith('Publishing to npm has failed.');
    expect(result).toBe(1);
    expect(mockExit).toHaveBeenCalledWith(1);
  });
}); 