/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import semver from 'semver';

import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as log from '../../utils/log.js';
import {publish, PublishOptions} from './publish.js';

// Mock dependencies
jest.mock('execa');
jest.mock('semver');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/log.js');

describe('publish.cli tests', () => {
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
  
  it('should publish with default options', async () => {
    const options: PublishOptions = {};
    
    const result = await publish(options, mockExit as unknown as typeof process.exit);
    
    expect(log.log).toHaveBeenCalledWith('Lex publishing npm module...', 'info', undefined);
    expect(LexConfig.parseConfig).toHaveBeenCalledWith(options);
    expect(app.getPackageJson).toHaveBeenCalledWith('/test/dir/package.json');
    expect(execa).toHaveBeenCalledWith(
      'npm',
      ['publish'],
      expect.objectContaining({
        encoding: 'utf8',
        stdio: 'inherit'
      })
    );
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Successfully published npm package: test-package!');
    expect(result).toBe(0);
    expect(mockExit).toHaveBeenCalledWith(0);
  });
  
  it('should use custom CLI name when provided', async () => {
    const options: PublishOptions = {
      cliName: 'CustomCLI'
    };
    
    await publish(options, mockExit as unknown as typeof process.exit);
    
    expect(log.log).toHaveBeenCalledWith('CustomCLI publishing npm module...', 'info', undefined);
  });
  
  it('should use custom package manager when provided', async () => {
    const options: PublishOptions = {
      packageManager: 'yarn'
    };
    
    await publish(options, mockExit as unknown as typeof process.exit);
    
    expect(execa).toHaveBeenCalledWith(
      'yarn',
      ['publish'],
      expect.any(Object)
    );
  });
  
  it('should use package manager from config when not provided in options', async () => {
    const options: PublishOptions = {};
    
    LexConfig.config = {
      packageManager: 'yarn'
    };
    
    await publish(options, mockExit as unknown as typeof process.exit);
    
    expect(execa).toHaveBeenCalledWith(
      'yarn',
      ['publish'],
      expect.any(Object)
    );
  });
  
  it('should respect quiet option', async () => {
    const options: PublishOptions = {
      quiet: true
    };
    
    await publish(options, mockExit as unknown as typeof process.exit);
    
    expect(log.log).toHaveBeenCalledWith(expect.any(String), expect.any(String), true);
    expect(app.createSpinner).toHaveBeenCalledWith(true);
  });
  
  it('should handle private option', async () => {
    const options: PublishOptions = {
      private: true
    };
    
    await publish(options, mockExit as unknown as typeof process.exit);
    
    expect(execa).toHaveBeenCalledWith(
      'npm',
      ['publish', '--access', 'restricted'],
      expect.any(Object)
    );
  });
  
  it('should handle otp option', async () => {
    const options: PublishOptions = {
      otp: '123456'
    };
    
    await publish(options, mockExit as unknown as typeof process.exit);
    
    expect(execa).toHaveBeenCalledWith(
      'npm',
      ['publish', '--otp', '123456'],
      expect.any(Object)
    );
  });
  
  it('should handle tag option', async () => {
    const options: PublishOptions = {
      tag: 'beta'
    };
    
    await publish(options, mockExit as unknown as typeof process.exit);
    
    expect(execa).toHaveBeenCalledWith(
      'npm',
      ['publish', '--tag', 'beta'],
      expect.any(Object)
    );
  });
  
  it('should handle newVersion option', async () => {
    const options: PublishOptions = {
      newVersion: '2.0.0'
    };
    
    await publish(options, mockExit as unknown as typeof process.exit);
    
    expect(app.setPackageJson).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test-package',
        version: '2.0.0'
      }),
      '/test/dir/package.json'
    );
  });
  
  it('should handle bump option with major version', async () => {
    const options: PublishOptions = {
      bump: 'major'
    };
    
    await publish(options, mockExit as unknown as typeof process.exit);
    
    expect(semver.inc).toHaveBeenCalledWith('1.0.0', 'major');
    expect(app.setPackageJson).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test-package',
        version: '2.0.0'
      }),
      '/test/dir/package.json'
    );
  });
  
  it('should handle bump option with minor version', async () => {
    const options: PublishOptions = {
      bump: 'minor'
    };
    
    await publish(options, mockExit as unknown as typeof process.exit);
    
    expect(semver.inc).toHaveBeenCalledWith('1.0.0', 'minor');
    expect(app.setPackageJson).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test-package',
        version: '1.1.0'
      }),
      '/test/dir/package.json'
    );
  });
  
  it('should handle bump option with patch version', async () => {
    const options: PublishOptions = {
      bump: 'patch'
    };
    
    await publish(options, mockExit as unknown as typeof process.exit);
    
    expect(semver.inc).toHaveBeenCalledWith('1.0.0', 'patch');
    expect(app.setPackageJson).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test-package',
        version: '1.0.1'
      }),
      '/test/dir/package.json'
    );
  });
  
  it('should handle bump option with prerelease', async () => {
    const options: PublishOptions = {
      bump: 'alpha'
    };
    
    await publish(options, mockExit as unknown as typeof process.exit);
    
    expect(semver.inc).toHaveBeenCalledWith('1.0.0', 'prerelease', 'alpha');
    expect(app.setPackageJson).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test-package',
        version: '1.0.1-alpha.0'
      }),
      '/test/dir/package.json'
    );
  });
  
  it('should handle yarn with nextVersion differently', async () => {
    const options: PublishOptions = {
      packageManager: 'yarn',
      bump: 'patch'
    };
    
    await publish(options, mockExit as unknown as typeof process.exit);
    
    expect(execa).toHaveBeenCalledWith(
      'yarn',
      ['publish', '--new-version', '1.0.1'],
      expect.any(Object)
    );
    expect(app.setPackageJson).not.toHaveBeenCalled();
  });
  
  it('should handle invalid version in package.json', async () => {
    (semver.valid as jest.Mock).mockReturnValue(false);
    
    const options: PublishOptions = {
      bump: 'patch'
    };
    
    const result = await publish(options, mockExit as unknown as typeof process.exit);
    
    expect(log.log).toHaveBeenCalledWith('\nLex Error: Version is invalid in package.json', 'error', undefined);
    expect(result).toBe(1);
    expect(mockExit).toHaveBeenCalledWith(1);
  });
  
  it('should handle invalid bump type', async () => {
    const options: PublishOptions = {
      bump: 'invalid'
    };
    
    const result = await publish(options, mockExit as unknown as typeof process.exit);
    
    expect(log.log).toHaveBeenCalledWith(
      expect.stringContaining('Error: Bump type is invalid'),
      'error',
      undefined
    );
    expect(result).toBe(1);
    expect(mockExit).toHaveBeenCalledWith(1);
  });
  
  it('should handle empty bump type', async () => {
    const options: PublishOptions = {
      bump: ''
    };
    
    const result = await publish(options, mockExit as unknown as typeof process.exit);
    
    expect(log.log).toHaveBeenCalledWith('\nLex Error: Bump type is missing.', 'error', undefined);
    expect(result).toBe(1);
    expect(mockExit).toHaveBeenCalledWith(1);
  });
  
  it('should handle package.json not found', async () => {
    (app.getPackageJson as jest.Mock).mockImplementationOnce(() => {
      throw new Error('File not found');
    });
    
    const options: PublishOptions = {};
    
    const result = await publish(options, mockExit as unknown as typeof process.exit);
    
    expect(log.log).toHaveBeenCalledWith(
      expect.stringContaining('Error: The file'),
      'error',
      undefined
    );
    expect(result).toBe(1);
    expect(mockExit).toHaveBeenCalledWith(1);
  });
  
  it('should handle setPackageJson error', async () => {
    (app.setPackageJson as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Write error');
    });
    
    const options: PublishOptions = {
      bump: 'patch'
    };
    
    const result = await publish(options, mockExit as unknown as typeof process.exit);
    
    expect(log.log).toHaveBeenCalledWith(
      expect.stringContaining('Error: The file'),
      'error',
      undefined
    );
    expect(result).toBe(1);
    expect(mockExit).toHaveBeenCalledWith(1);
  });
  
  it('should handle publish error', async () => {
    (execa as unknown as jest.Mock).mockRejectedValueOnce(new Error('Publish failed'));
    
    const options: PublishOptions = {};
    
    const result = await publish(options, mockExit as unknown as typeof process.exit);
    
    expect(log.log).toHaveBeenCalledWith('\nLex Error: Publish failed', 'error', undefined);
    expect(mockSpinner.fail).toHaveBeenCalledWith('Publishing to npm has failed.');
    expect(result).toBe(1);
    expect(mockExit).toHaveBeenCalledWith(1);
  });
  
  it('should work with process.exit as default callback', async () => {
    const options: PublishOptions = {};
    
    // Save original process.exit
    const originalExit = process.exit;
    
    // Mock process.exit
    process.exit = jest.fn() as unknown as typeof process.exit;
    
    try {
      await publish(options);
      
      expect(process.exit).toHaveBeenCalledWith(0);
    } finally {
      // Restore original process.exit
      process.exit = originalExit;
    }
  });
}); 