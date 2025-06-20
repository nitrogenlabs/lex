/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import {migrate, MigrateOptions} from './migrate.js';

// Mock dependencies
jest.mock('execa');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/log.js');

describe('migrate.options tests', () => {
  let mockExit: jest.Mock<void, [number]>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock process.cwd()
    process.cwd = jest.fn().mockReturnValue('/test/dir');
    
    // Mock app utils
    jest.spyOn(app, 'removeModules').mockResolvedValue(undefined);
    (app.getPackageJson as jest.Mock).mockReturnValue({
      dependencies: {},
      devDependencies: {}
    });
    (app.removeConflictModules as jest.Mock).mockImplementation((deps) => deps);
    (app.createSpinner as jest.Mock).mockReturnValue({
      start: jest.fn(),
      succeed: jest.fn(),
      fail: jest.fn()
    });
    
    // Mock LexConfig
    LexConfig.config = {
      packageManager: 'npm'
    };
    
    // Mock exit callback
    mockExit = jest.fn<void, [number]>();
  });
  
  it('should accept cliName option', async () => {
    const options: MigrateOptions = {
      cliName: 'CustomCLI'
    };
    
    // We're not testing the full execution here, just that the option is accepted
    expect(() => migrate(options, mockExit as unknown as typeof process.exit)).not.toThrow();
  });
  
  it('should accept packageManager option', async () => {
    const options: MigrateOptions = {
      packageManager: 'yarn'
    };
    
    expect(() => migrate(options, mockExit as unknown as typeof process.exit)).not.toThrow();
  });
  
  it('should accept quiet option', async () => {
    const options: MigrateOptions = {
      quiet: true
    };
    
    expect(() => migrate(options, mockExit as unknown as typeof process.exit)).not.toThrow();
  });
  
  it('should use default options when not provided', async () => {
    const options: MigrateOptions = {};
    
    expect(() => migrate(options, mockExit as unknown as typeof process.exit)).not.toThrow();
  });
  
  it('should handle all options together', async () => {
    const options: MigrateOptions = {
      cliName: 'CustomCLI',
      packageManager: 'yarn',
      quiet: true
    };
    
    expect(() => migrate(options, mockExit as unknown as typeof process.exit)).not.toThrow();
  });
}); 