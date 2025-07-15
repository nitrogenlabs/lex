/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {create, CreateOptions} from './create.js';
import * as changelog from '../../create/changelog.js';
import {LexConfig} from '../../LexConfig.js';
import * as log from '../../utils/log.js';

// Mock dependencies
jest.mock('../../create/changelog.js');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/log.js');

describe('create.options tests', () => {
  let mockCallback: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock process.cwd()
    process.cwd = jest.fn().mockReturnValue('/test/dir');

    // Mock URL
    global.URL = jest.fn().mockImplementation(() => ({
      pathname: '/test/path'
    })) as any;

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

  it('should respect cliName option when provided', async () => {
    const customName = 'CustomCLI';
    const options: CreateOptions = {
      cliName: customName,
      quiet: false
    };

    await create('changelog', options, mockCallback);

    // Should use custom name in logs
    expect(log.log).toHaveBeenCalledWith(`${customName} creating changelog...`, 'info', false);

    // Should pass custom name to createChangelog
    expect(changelog.createChangelog).toHaveBeenCalledWith(
      expect.objectContaining({
        cliName: customName
      })
    );
  });

  it('should use default CLI name when not provided', async () => {
    const options: CreateOptions = {
      quiet: false
    };

    await create('changelog', options, mockCallback);

    // Should use default name in logs
    expect(log.log).toHaveBeenCalledWith('Lex creating changelog...', 'info', false);

    // Should pass default name to createChangelog
    expect(changelog.createChangelog).toHaveBeenCalledWith(
      expect.objectContaining({
        cliName: 'Lex'
      })
    );
  });

  it('should respect quiet option when true', async () => {
    const options: CreateOptions = {
      quiet: true
    };

    await create('changelog', options, mockCallback);

    // Should log with quiet=true
    expect(log.log).toHaveBeenCalledWith('Lex creating changelog...', 'info', true);

    // Should pass quiet=true to createChangelog
    expect(changelog.createChangelog).toHaveBeenCalledWith(
      expect.objectContaining({
        quiet: true
      })
    );
  });

  it('should respect quiet option when false', async () => {
    const options: CreateOptions = {
      quiet: false
    };

    await create('changelog', options, mockCallback);

    // Should log with quiet=false
    expect(log.log).toHaveBeenCalledWith('Lex creating changelog...', 'info', false);

    // Should pass quiet=false to createChangelog
    expect(changelog.createChangelog).toHaveBeenCalledWith(
      expect.objectContaining({
        quiet: false
      })
    );
  });

  it('should respect outputFile option when provided', async () => {
    const outputFile = 'custom-changelog.md';
    const options: CreateOptions = {
      outputFile,
      quiet: false
    };

    await create('changelog', options, mockCallback);

    // Should pass outputFile to createChangelog
    expect(changelog.createChangelog).toHaveBeenCalledWith(
      expect.objectContaining({
        outputFile
      })
    );
  });

  it('should respect outputName option when provided', async () => {
    const outputName = 'customName';
    const options: CreateOptions = {
      outputName,
      quiet: false
    };

    await create('changelog', options, mockCallback);

    // Should pass options to LexConfig.parseConfig
    expect(LexConfig.parseConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        outputName
      }),
      false
    );
  });

  it('should handle empty options object', async () => {
    const options: CreateOptions = {};

    await create('changelog', options, mockCallback);

    // Should use default values
    expect(log.log).toHaveBeenCalledWith('Lex creating changelog...', 'info', undefined);

    // Should pass default values to createChangelog
    expect(changelog.createChangelog).toHaveBeenCalledWith(
      expect.objectContaining({
        cliName: 'Lex',
        quiet: undefined
      })
    );
  });

  it('should handle all options being set', async () => {
    const customName = 'CustomCLI';
    const outputFile = 'custom-changelog.md';
    const outputName = 'customName';
    const options: CreateOptions = {
      cliName: customName,
      outputFile,
      outputName,
      quiet: true
    };

    await create('changelog', options, mockCallback);

    // Should use all options
    expect(log.log).toHaveBeenCalledWith(`${customName} creating changelog...`, 'info', true);

    // Should pass all options to createChangelog
    expect(changelog.createChangelog).toHaveBeenCalledWith(
      expect.objectContaining({
        cliName: customName,
        outputFile,
        quiet: true
      })
    );

    // Should pass options to LexConfig.parseConfig
    expect(LexConfig.parseConfig).toHaveBeenCalledWith(options, false);
  });
});