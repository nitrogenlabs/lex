/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import {publish, PublishOptions} from './publish.js';

// Mock dependencies
jest.mock('execa');
jest.mock('semver');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/log.js');

describe('publish.options tests', () => {
  let mockExit: jest.Mock<void, [number]>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock process.cwd()
    process.cwd = jest.fn().mockReturnValue('/test/dir');
    
    // Mock app utils
    (app.getPackageJson as jest.Mock).mockReturnValue({
      name: 'test-package',
      version: '1.0.0'
    });
    (app.setPackageJson as jest.Mock).mockImplementation(() => {});
    (app.createSpinner as jest.Mock).mockReturnValue({
      start: jest.fn(),
      succeed: jest.fn(),
      fail: jest.fn()
    });
    
    // Mock LexConfig
    LexConfig.parseConfig = jest.fn().mockResolvedValue(undefined);
    LexConfig.config = {
      packageManager: 'npm'
    };
    
    // Mock exit callback
    mockExit = jest.fn<void, [number]>();
  });
  
  it('should accept bump option', async () => {
    const options: PublishOptions = {
      bump: 'patch'
    };
    
    // We're not testing the full execution here, just that the option is accepted
    expect(() => publish(options, mockExit as unknown as typeof process.exit)).not.toThrow();
  });
  
  it('should accept cliName option', async () => {
    const options: PublishOptions = {
      cliName: 'CustomCLI'
    };
    
    expect(() => publish(options, mockExit as unknown as typeof process.exit)).not.toThrow();
  });
  
  it('should accept newVersion option', async () => {
    const options: PublishOptions = {
      newVersion: '2.0.0'
    };
    
    expect(() => publish(options, mockExit as unknown as typeof process.exit)).not.toThrow();
  });
  
  it('should accept otp option', async () => {
    const options: PublishOptions = {
      otp: '123456'
    };
    
    expect(() => publish(options, mockExit as unknown as typeof process.exit)).not.toThrow();
  });
  
  it('should accept packageManager option', async () => {
    const options: PublishOptions = {
      packageManager: 'yarn'
    };
    
    expect(() => publish(options, mockExit as unknown as typeof process.exit)).not.toThrow();
  });
  
  it('should accept private option', async () => {
    const options: PublishOptions = {
      private: true
    };
    
    expect(() => publish(options, mockExit as unknown as typeof process.exit)).not.toThrow();
  });
  
  it('should accept quiet option', async () => {
    const options: PublishOptions = {
      quiet: true
    };
    
    expect(() => publish(options, mockExit as unknown as typeof process.exit)).not.toThrow();
  });
  
  it('should accept tag option', async () => {
    const options: PublishOptions = {
      tag: 'beta'
    };
    
    expect(() => publish(options, mockExit as unknown as typeof process.exit)).not.toThrow();
  });
  
  it('should use default options when not provided', async () => {
    const options: PublishOptions = {};
    
    expect(() => publish(options, mockExit as unknown as typeof process.exit)).not.toThrow();
  });
  
  it('should handle all options together', async () => {
    const options: PublishOptions = {
      bump: 'patch',
      cliName: 'CustomCLI',
      newVersion: '2.0.0',
      otp: '123456',
      packageManager: 'yarn',
      private: true,
      quiet: true,
      tag: 'beta'
    };
    
    expect(() => publish(options, mockExit as unknown as typeof process.exit)).not.toThrow();
  });
  
  it('should handle different bump types', async () => {
    const bumpTypes = ['major', 'minor', 'patch', 'alpha', 'beta', 'rc'];
    
    for (const bumpType of bumpTypes) {
      const options: PublishOptions = {
        bump: bumpType
      };
      
      expect(() => publish(options, mockExit as unknown as typeof process.exit)).not.toThrow();
    }
  });
}); 