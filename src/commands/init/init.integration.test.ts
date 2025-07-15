/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import fs from 'fs';
import path from 'path';

import {init} from './init.js';
import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as log from '../../utils/log.js';

// Mock dependencies
jest.mock('execa');
jest.mock('fs');
jest.mock('path');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/log.js');

describe('init.integration tests', () => {
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
  });

  afterEach(() => {
    // Restore console.log
    (console.log as jest.Mock).mockRestore();
  });

  it('should initialize a TypeScript project successfully', async () => {
    const appName = 'test-app';
    const packageName = '';

    const result = await init(appName, packageName, {
      typescript: true,
      install: true,
      quiet: false
    });

    // Check that TypeScript template was used
    expect(execa).toHaveBeenCalledWith(
      expect.any(String),
      ['@nlabs/arkhamjs-example-ts-react', expect.any(String)],
      expect.any(Object)
    );

    // Check that package.json was updated correctly
    expect(app.setPackageJson).toHaveBeenCalledWith(
      expect.objectContaining({
        name: appName,
        description: 'Lex created app',
        version: '0.1.0'
      }),
      expect.any(String)
    );

    // Check that dependencies were installed
    expect(process.chdir).toHaveBeenCalledWith(`/test/dir/./${appName}`);
    expect(execa).toHaveBeenCalledWith(
      'npm',
      ['install'],
      expect.objectContaining({
        encoding: 'utf8',
        stdio: 'inherit'
      })
    );

    expect(result).toBe(0);
  });

  it('should initialize a Flow project successfully', async () => {
    const appName = 'test-app';
    const packageName = '';

    const result = await init(appName, packageName, {
      typescript: false,
      install: true,
      quiet: false
    });

    // Check that Flow template was used
    expect(execa).toHaveBeenCalledWith(
      expect.any(String),
      ['@nlabs/arkhamjs-example-flow-react', expect.any(String)],
      expect.any(Object)
    );

    // Check that package.json was updated correctly
    expect(app.setPackageJson).toHaveBeenCalledWith(
      expect.objectContaining({
        name: appName,
        description: 'Lex created app',
        version: '0.1.0'
      }),
      expect.any(String)
    );

    // Check that dependencies were installed
    expect(process.chdir).toHaveBeenCalledWith(`/test/dir/./${appName}`);
    expect(execa).toHaveBeenCalledWith(
      'npm',
      ['install'],
      expect.objectContaining({
        encoding: 'utf8',
        stdio: 'inherit'
      })
    );

    expect(result).toBe(0);
  });

  it('should initialize a project with a custom package', async () => {
    const appName = 'test-app';
    const packageName = '@custom/template';

    const result = await init(appName, packageName, {
      install: true,
      quiet: false
    });

    // Check that custom package was used
    expect(execa).toHaveBeenCalledWith(
      expect.any(String),
      [packageName, expect.any(String)],
      expect.any(Object)
    );

    // Check that package.json was updated correctly
    expect(app.setPackageJson).toHaveBeenCalledWith(
      expect.objectContaining({
        name: appName,
        description: 'Lex created app',
        version: '0.1.0'
      }),
      expect.any(String)
    );

    expect(result).toBe(0);
  });

  it('should initialize a project without installing dependencies', async () => {
    const appName = 'test-app';
    const packageName = '@test/package';

    const result = await init(appName, packageName, {
      install: false,
      quiet: false
    });

    // Check that dependencies were not installed
    expect(process.chdir).not.toHaveBeenCalled();
    expect(execa).toHaveBeenCalledTimes(1); // Only called once for download, not for install

    expect(result).toBe(0);
  });

  it('should handle download errors gracefully', async () => {
    const appName = 'test-app';
    const packageName = '@test/package';

    // Mock download failure
    (execa as unknown as jest.Mock).mockRejectedValueOnce(new Error('Download failed'));

    const result = await init(appName, packageName, {
      quiet: false
    });

    expect(log.log).toHaveBeenCalledWith(
      expect.stringContaining('Error: There was an error downloading'),
      'error',
      false
    );
    expect(mockSpinner.fail).toHaveBeenCalledWith('Downloaded of app failed.');
    expect(result).toBe(1);
  });

  it('should handle installation errors gracefully', async () => {
    const appName = 'test-app';
    const packageName = '@test/package';

    // First execa call succeeds (download), second fails (install)
    (execa as unknown as jest.Mock)
      .mockResolvedValueOnce({stdout: 'download success', stderr: ''})
      .mockRejectedValueOnce(new Error('Install failed'));

    const result = await init(appName, packageName, {
      install: true,
      quiet: false
    });

    expect(log.log).toHaveBeenCalledWith(
      '\nLex Error: Install failed',
      'error',
      false
    );
    expect(mockSpinner.fail).toHaveBeenCalledWith('Failed to install dependencies.');
    expect(result).toBe(1);
  });
});