/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import fs from 'fs';
import path from 'path';

import {create, CreateOptions} from './create.js';
import * as changelog from '../../create/changelog.js';
import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as log from '../../utils/log.js';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('../../create/changelog.js');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/log.js');

describe('create.cli tests', () => {
  let mockCallback: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock process.cwd()
    process.cwd = jest.fn().mockReturnValue('/test/dir');

    // Mock URL
    global.URL = jest.fn().mockImplementation(() => ({
      pathname: '/test/path'
    })) as any;

    // Mock fs
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.readFileSync as jest.Mock).mockReturnValue('template content');
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (fs.renameSync as jest.Mock).mockImplementation(() => {});

    // Mock path
    (path.resolve as jest.Mock).mockImplementation((...args) => args.join('/'));

    // Mock app utilities
    (app.copyFolderRecursiveSync as jest.Mock).mockImplementation(() => {});
    (app.getFilenames as jest.Mock).mockReturnValue({
      nameCaps: 'Sample',
      templateExt: '.ts',
      templatePath: '/templates',
      templateReact: '.tsx'
    });
    (app.removeFiles as jest.Mock).mockResolvedValue(undefined);
    (app.updateTemplateName as jest.Mock).mockImplementation(() => {});

    // Mock changelog
    (changelog.createChangelog as jest.Mock).mockResolvedValue(0);

    // Mock LexConfig
    LexConfig.parseConfig = jest.fn().mockResolvedValue(undefined);
    LexConfig.checkTypescriptConfig = jest.fn();
    LexConfig.config = {
      outputPath: './dist',
      sourcePath: './src',
      useTypescript: true
    };

    // Mock callback
    mockCallback = jest.fn();
  });

  it('should create a changelog', async () => {
    const options: CreateOptions = {
      cliName: 'TestCLI',
      outputFile: 'CHANGELOG.md',
      quiet: false
    };

    const result = await create('changelog', options, mockCallback);

    expect(log.log).toHaveBeenCalledWith('TestCLI creating changelog...', 'info', false);
    expect(LexConfig.parseConfig).toHaveBeenCalledWith(options, false);
    expect(changelog.createChangelog).toHaveBeenCalledWith({
      cliName: 'TestCLI',
      config: undefined,
      outputFile: 'CHANGELOG.md',
      quiet: false
    });
    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should create a store', async () => {
    const options: CreateOptions = {
      cliName: 'TestCLI',
      outputName: 'sample',
      quiet: false
    };

    const result = await create('store', options, mockCallback);

    expect(log.log).toHaveBeenCalledWith('TestCLI creating store...', 'info', false);
    expect(LexConfig.parseConfig).toHaveBeenCalledWith(options, false);
    expect(app.getFilenames).toHaveBeenCalledWith({
      cliName: 'TestCLI',
      name: 'sample',
      quiet: false,
      type: 'store',
      useTypescript: true
    });
    expect(app.copyFolderRecursiveSync).toHaveBeenCalled();
    expect(fs.renameSync).toHaveBeenCalledTimes(3);
    expect(app.updateTemplateName).toHaveBeenCalledTimes(2);
    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should handle store creation when directory already exists', async () => {
    const options: CreateOptions = {
      cliName: 'TestCLI',
      outputName: 'sample',
      quiet: false
    };

    // Mock directory already exists
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    const result = await create('store', options, mockCallback);

    expect(log.log).toHaveBeenCalledWith(
      expect.stringContaining('Error: Cannot create new store'),
      'error',
      false
    );
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  it('should handle store creation errors', async () => {
    const options: CreateOptions = {
      cliName: 'TestCLI',
      outputName: 'sample',
      quiet: false
    };

    // Mock error during creation
    (app.copyFolderRecursiveSync as jest.Mock).mockImplementation(() => {
      throw new Error('Test error');
    });

    const result = await create('store', options, mockCallback);

    expect(log.log).toHaveBeenCalledWith(
      expect.stringContaining('Error: Cannot create new store'),
      'error',
      false
    );
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  it('should create a tsconfig file', async () => {
    const options: CreateOptions = {
      cliName: 'TestCLI',
      quiet: false
    };

    const result = await create('tsconfig', options, mockCallback);

    expect(log.log).toHaveBeenCalledWith('TestCLI creating tsconfig...', 'info', false);
    expect(app.removeFiles).toHaveBeenCalledWith('tsconfig.json', true);
    expect(fs.readFileSync).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should create a view', async () => {
    const options: CreateOptions = {
      cliName: 'TestCLI',
      outputName: 'sample',
      quiet: false
    };

    const result = await create('view', options, mockCallback);

    expect(log.log).toHaveBeenCalledWith('TestCLI creating view...', 'info', false);
    expect(app.getFilenames).toHaveBeenCalledWith({
      cliName: 'TestCLI',
      name: 'sample',
      quiet: false,
      type: 'view',
      useTypescript: true
    });
    expect(app.copyFolderRecursiveSync).toHaveBeenCalled();
    expect(fs.renameSync).toHaveBeenCalledTimes(4);
    expect(app.updateTemplateName).toHaveBeenCalledTimes(3);
    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should create vscode configuration', async () => {
    const options: CreateOptions = {
      cliName: 'TestCLI',
      quiet: false
    };

    const result = await create('vscode', options, mockCallback);

    expect(log.log).toHaveBeenCalledWith('TestCLI creating vscode...', 'info', false);
    expect(app.removeFiles).toHaveBeenCalledWith('.vscode', true);
    expect(app.copyFolderRecursiveSync).toHaveBeenCalled();
    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should use default CLI name when not provided', async () => {
    const options: CreateOptions = {
      quiet: false
    };

    await create('changelog', options, mockCallback);

    expect(log.log).toHaveBeenCalledWith('Lex creating changelog...', 'info', false);
  });

  it('should respect quiet option', async () => {
    const options: CreateOptions = {
      quiet: true
    };

    await create('changelog', options, mockCallback);

    expect(log.log).toHaveBeenCalledWith('Lex creating changelog...', 'info', true);
  });
});