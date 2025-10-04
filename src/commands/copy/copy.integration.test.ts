import fs from 'fs';

import {copy, CopyOptions} from './copy.js';
import * as app from '../../utils/app.js';
import * as log from '../../utils/log.js';

jest.mock('execa');
jest.mock('fs');
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  copyFileSync: jest.fn(),
  copyFolderRecursiveSync: jest.fn(),
  createSpinner: jest.fn(() => ({
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn()
  }))
}));
jest.mock('../../utils/log.js');

describe('copy integration', () => {
  let consoleLogSpy;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.lstatSync as jest.Mock).mockReturnValue({
      isDirectory: jest.fn().mockReturnValue(false)
    });

    (app.copyFileSync as jest.Mock).mockImplementation(() => {});
    (app.copyFolderRecursiveSync as jest.Mock).mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('should integrate with fs to check if source exists', async () => {
    const from = './source.txt';
    const to = './destination.txt';
    const options: CopyOptions = {
      quiet: false
    };
    const mockCallback = jest.fn();

    await copy(from, to, options, mockCallback);

    expect(fs.existsSync).toHaveBeenCalledWith(from);
  });

  it('should integrate with fs to check if source is a directory', async () => {
    const from = './source.txt';
    const to = './destination.txt';
    const options: CopyOptions = {
      quiet: false
    };
    const mockCallback = jest.fn();

    await copy(from, to, options, mockCallback);

    expect(fs.lstatSync).toHaveBeenCalledWith(from);
  });

  it('should integrate with app.copyFileSync for file copying', async () => {
    const from = './source.txt';
    const to = './destination.txt';
    const options: CopyOptions = {
      quiet: false
    };
    const mockCallback = jest.fn();

    await copy(from, to, options, mockCallback);

    expect(app.copyFileSync).toHaveBeenCalledWith(from, to);
    expect(app.copyFolderRecursiveSync).not.toHaveBeenCalled();
  });

  it('should integrate with app.copyFolderRecursiveSync for directory copying', async () => {
    const from = './source-dir';
    const to = './destination-dir';
    const options: CopyOptions = {
      quiet: false
    };
    const mockCallback = jest.fn();

    (fs.lstatSync as jest.Mock).mockReturnValue({
      isDirectory: jest.fn().mockReturnValue(true)
    });

    await copy(from, to, options, mockCallback);

    expect(app.copyFolderRecursiveSync).toHaveBeenCalledWith(from, to);
    expect(app.copyFileSync).not.toHaveBeenCalled();
  });

  it('should handle non-existent source path', async () => {
    const from = './nonexistent.txt';
    const to = './destination.txt';
    const options: CopyOptions = {
      quiet: false
    };
    const mockCallback = jest.fn();

    (fs.existsSync as jest.Mock).mockReturnValue(false);

    const result = await copy(from, to, options, mockCallback);

    expect(log.log).toHaveBeenCalledWith(expect.stringContaining('Error: Path not found'), 'error', false);
    expect(app.copyFileSync).not.toHaveBeenCalled();
    expect(app.copyFolderRecursiveSync).not.toHaveBeenCalled();
    expect(result).toBe(1);
  });

  it('should handle file copy errors', async () => {
    const from = './source.txt';
    const to = './destination.txt';
    const options: CopyOptions = {
      quiet: false
    };
    const mockCallback = jest.fn();

    const errorMessage = 'Permission denied';
    (app.copyFileSync as jest.Mock).mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const result = await copy(from, to, options, mockCallback);

    expect(log.log).toHaveBeenCalledWith(expect.stringContaining('Error: Cannot copy'), 'error', false);
    expect(result).toBe(1);
  });

  it('should handle directory copy errors', async () => {
    const from = './source-dir';
    const to = './destination-dir';
    const options: CopyOptions = {
      quiet: false
    };
    const mockCallback = jest.fn();

    (fs.lstatSync as jest.Mock).mockReturnValue({
      isDirectory: jest.fn().mockReturnValue(true)
    });

    const errorMessage = 'Permission denied';
    (app.copyFolderRecursiveSync as jest.Mock).mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const result = await copy(from, to, options, mockCallback);

    expect(log.log).toHaveBeenCalledWith(expect.stringContaining('Error: Cannot copy'), 'error', false);
    expect(result).toBe(1);
  });

  it('should properly integrate logging with copy operations', async () => {
    const from = './source.txt';
    const to = './destination.txt';
    const options: CopyOptions = {
      quiet: false
    };
    const mockCallback = jest.fn();

    await copy(from, to, options, mockCallback);

    const logCallOrder = (log.log as jest.Mock).mock.invocationCallOrder[0];
    const copyCallOrder = (app.copyFileSync as jest.Mock).mock.invocationCallOrder[0];

    expect(logCallOrder).toBeLessThan(copyCallOrder);
  });
});