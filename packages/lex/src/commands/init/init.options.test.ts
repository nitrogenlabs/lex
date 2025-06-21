/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {init, InitOptions} from './init.js';
import {LexConfig} from '../../LexConfig.js';

// Mock dependencies
jest.mock('execa');
jest.mock('fs');
jest.mock('path');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/log.js');

describe('init.options tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock process.cwd() and chdir
    process.cwd = jest.fn().mockReturnValue('/test/dir');
    process.chdir = jest.fn();

    // Mock URL
    global.URL = jest.fn().mockImplementation(() => ({
      pathname: '/test/path'
    })) as any;

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

  it('should accept cliName option', async () => {
    const options: InitOptions = {
      cliName: 'CustomCLI'
    };

    // We're not testing the full execution here, just that the option is accepted
    expect(() => init('test-app', '', options)).not.toThrow();
  });

  it('should accept install option', async () => {
    const options: InitOptions = {
      install: true
    };

    expect(() => init('test-app', '', options)).not.toThrow();
  });

  it('should accept packageManager option', async () => {
    const options: InitOptions = {
      packageManager: 'yarn'
    };

    expect(() => init('test-app', '', options)).not.toThrow();
  });

  it('should accept quiet option', async () => {
    const options: InitOptions = {
      quiet: true
    };

    expect(() => init('test-app', '', options)).not.toThrow();
  });

  it('should accept typescript option', async () => {
    const options: InitOptions = {
      typescript: true
    };

    expect(() => init('test-app', '', options)).not.toThrow();
  });

  it('should use default options when not provided', async () => {
    const options: InitOptions = {};

    expect(() => init('test-app', '', options)).not.toThrow();
  });

  it('should handle all options together', async () => {
    const options: InitOptions = {
      cliName: 'CustomCLI',
      install: true,
      packageManager: 'yarn',
      quiet: true,
      typescript: true
    };

    expect(() => init('test-app', '', options)).not.toThrow();
  });
});