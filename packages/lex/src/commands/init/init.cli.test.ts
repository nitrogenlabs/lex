/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import fs from 'fs';
import path from 'path';

import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as log from '../../utils/log.js';
import {init, InitOptions} from './init.js';

// Mock dependencies
jest.mock('execa');
jest.mock('fs');
jest.mock('path');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/log.js');

describe('init.cli tests', () => {
  let mockCallback: jest.Mock;
  let mockSpinner: {
    start: jest.Mock;
    succeed: jest.Mock;
    fail: jest.Mock;
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock process.cwd() and chdir
    process.cwd = jest.fn().mockReturnValue('/test/dir');
    process.chdir = jest.fn();
    
    // Mock URL
    global.URL = jest.fn().mockImplementation(() => ({
      pathname: '/test/path'
    })) as any;
    
    // Mock fs
    (fs.renameSync as jest.Mock).mockImplementation(() => {});
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    
    // Mock path
    (path.resolve as jest.Mock).mockImplementation((...args) => args.join('/'));
    
    // Mock spinner
    mockSpinner = {
      start: jest.fn(),
      succeed: jest.fn(),
      fail: jest.fn()
    };
    (app.createSpinner as jest.Mock).mockReturnValue(mockSpinner);
    (app.getPackageJson as jest.Mock).mockReturnValue({
      name: 'original-name',
      description: 'Original description',
      version: '1.0.0',
      keywords: ['test'],
      author: 'Test Author',
      contributors: ['Contributor 1'],
      repository: 'test-repo',
      homepage: 'test-homepage',
      bugs: 'test-bugs'
    });
    (app.setPackageJson as jest.Mock).mockImplementation(() => {});
    
    // Mock execa
    (execa as unknown as jest.Mock).mockResolvedValue({
      stdout: 'execa output',
      stderr: ''
    });
    
    // Mock LexConfig
    LexConfig.parseConfig = jest.fn().mockResolvedValue(undefined);
    LexConfig.config = {
      packageManager: 'npm',
      useTypescript: true
    };
    
    // Mock console.log to prevent test output pollution
    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Mock callback
    mockCallback = jest.fn();
  });
  
  afterEach(() => {
    // Restore console.log
    (console.log as jest.Mock).mockRestore();
  });
  
  it('should initialize an app with default options', async () => {
    const appName = 'test-app';
    const packageName = '@test/package';
    const options: InitOptions = {
      quiet: false
    };
    
    const result = await init(appName, packageName, options, mockCallback);
    
    expect(log.log).toHaveBeenCalledWith('Lex is downloading the app module...', 'info', false);
    expect(mockSpinner.start).toHaveBeenCalledWith('Downloading app...');
    expect(execa).toHaveBeenCalledWith(
      expect.stringContaining('download-npm-package/bin/cli.js'),
      [packageName, '/test/dir/./.lexTmp'],
      {}
    );
    expect(fs.renameSync).toHaveBeenCalledWith(
      `/test/dir/./.lexTmp/${packageName}`,
      `/test/dir/./${appName}`
    );
    expect(app.getPackageJson).toHaveBeenCalledWith(`/test/dir/./${appName}/package.json`);
    expect(app.setPackageJson).toHaveBeenCalledWith(
      expect.objectContaining({
        name: appName,
        description: 'Lex created app',
        version: '0.1.0'
      }),
      `/test/dir/./${appName}/package.json`
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      `/test/dir/./${appName}/README.md`,
      `# ${appName}`
    );
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Successfully downloaded app!');
    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });
  
  it('should use TypeScript template when no package name is provided and TypeScript is enabled', async () => {
    const appName = 'test-app';
    const options: InitOptions = {
      quiet: false,
      typescript: true
    };
    
    await init(appName, '', options, mockCallback);
    
    expect(execa).toHaveBeenCalledWith(
      expect.any(String),
      ['@nlabs/arkhamjs-example-ts-react', expect.any(String)],
      expect.any(Object)
    );
  });
  
  it('should use Flow template when no package name is provided and TypeScript is disabled', async () => {
    const appName = 'test-app';
    const options: InitOptions = {
      quiet: false,
      typescript: false
    };
    
    await init(appName, '', options, mockCallback);
    
    expect(execa).toHaveBeenCalledWith(
      expect.any(String),
      ['@nlabs/arkhamjs-example-flow-react', expect.any(String)],
      expect.any(Object)
    );
  });
  
  it('should install dependencies when install option is true', async () => {
    const appName = 'test-app';
    const packageName = '@test/package';
    const options: InitOptions = {
      install: true,
      quiet: false
    };
    
    await init(appName, packageName, options, mockCallback);
    
    expect(mockSpinner.start).toHaveBeenCalledWith('Installing dependencies...');
    expect(process.chdir).toHaveBeenCalledWith(`/test/dir/./${appName}`);
    expect(execa).toHaveBeenCalledWith(
      'npm',
      ['install'],
      expect.objectContaining({
        encoding: 'utf8',
        stdio: 'inherit'
      })
    );
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Successfully installed dependencies!');
  });
  
  it('should use custom package manager when provided', async () => {
    const appName = 'test-app';
    const packageName = '@test/package';
    const options: InitOptions = {
      install: true,
      packageManager: 'yarn',
      quiet: false
    };
    
    await init(appName, packageName, options, mockCallback);
    
    expect(execa).toHaveBeenCalledWith(
      'yarn',
      ['install'],
      expect.any(Object)
    );
  });
  
  it('should use package manager from config when not provided in options', async () => {
    const appName = 'test-app';
    const packageName = '@test/package';
    const options: InitOptions = {
      install: true,
      quiet: false
    };
    
    LexConfig.config = {
      ...LexConfig.config,
      packageManager: 'yarn'
    };
    
    await init(appName, packageName, options, mockCallback);
    
    expect(execa).toHaveBeenCalledWith(
      'yarn',
      ['install'],
      expect.any(Object)
    );
  });
  
  it('should handle download errors', async () => {
    const appName = 'test-app';
    const packageName = '@test/package';
    const options: InitOptions = {
      quiet: false
    };
    
    const errorMessage = 'Download failed';
    (execa as unknown as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
    
    const result = await init(appName, packageName, options, mockCallback);
    
    expect(log.log).toHaveBeenCalledWith(
      expect.stringContaining('Error: There was an error downloading'),
      'error',
      false
    );
    expect(mockSpinner.fail).toHaveBeenCalledWith('Downloaded of app failed.');
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });
  
  it('should handle rename errors', async () => {
    const appName = 'test-app';
    const packageName = '@test/package';
    const options: InitOptions = {
      quiet: false
    };
    
    (fs.renameSync as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Rename failed');
    });
    
    const result = await init(appName, packageName, options, mockCallback);
    
    expect(log.log).toHaveBeenCalledWith(
      expect.stringContaining('Error: There was an error copying'),
      'error',
      false
    );
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });
  
  it('should handle package.json update errors', async () => {
    const appName = 'test-app';
    const packageName = '@test/package';
    const options: InitOptions = {
      quiet: false
    };
    
    (app.setPackageJson as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Update failed');
    });
    
    const result = await init(appName, packageName, options, mockCallback);
    
    expect(log.log).toHaveBeenCalledWith(
      '\nLex Error: Update failed',
      'error',
      false
    );
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });
  
  it('should handle installation errors', async () => {
    const appName = 'test-app';
    const packageName = '@test/package';
    const options: InitOptions = {
      install: true,
      quiet: false
    };
    
    // First execa call succeeds (download), second fails (install)
    (execa as unknown as jest.Mock)
      .mockResolvedValueOnce({stdout: 'download success', stderr: ''})
      .mockRejectedValueOnce(new Error('Install failed'));
    
    const result = await init(appName, packageName, options, mockCallback);
    
    expect(log.log).toHaveBeenCalledWith(
      '\nLex Error: Install failed',
      'error',
      false
    );
    expect(mockSpinner.fail).toHaveBeenCalledWith('Failed to install dependencies.');
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });
  
  it('should use custom CLI name when provided', async () => {
    const appName = 'test-app';
    const packageName = '@test/package';
    const options: InitOptions = {
      cliName: 'CustomCLI',
      quiet: false
    };
    
    await init(appName, packageName, options, mockCallback);
    
    expect(log.log).toHaveBeenCalledWith('CustomCLI is downloading the app module...', 'info', false);
    expect(app.setPackageJson).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'CustomCLI created app'
      }),
      expect.any(String)
    );
  });
  
  it('should respect quiet option', async () => {
    const appName = 'test-app';
    const packageName = '@test/package';
    const options: InitOptions = {
      quiet: true
    };
    
    await init(appName, packageName, options, mockCallback);
    
    expect(log.log).toHaveBeenCalledWith(expect.any(String), expect.any(String), true);
    expect(app.createSpinner).toHaveBeenCalledWith(true);
  });
}); 