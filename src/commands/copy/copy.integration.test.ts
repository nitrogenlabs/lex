import fs from 'fs';

import {copy, CopyOptions} from './copy.js';
import * as app from '../../utils/app.js';
import * as log from '../../utils/log.js';

vi.mock('execa');
vi.mock('fs');
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  copyFileSync: vi.fn(),
  copyFolderRecursiveSync: vi.fn(),
  createSpinner: vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn()
  }))
}));
vi.mock('../../utils/log.js');

describe('copy integration', () => {
  let consoleLogSpy;

  beforeAll(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    vi.clearAllMocks();

    (fs.existsSync as Mock).mockReturnValue(true);
    (fs.lstatSync as Mock).mockReturnValue({
      isDirectory: vi.fn().mockReturnValue(false)
    });

    (app.copyFileSync as Mock).mockImplementation(() => {});
    (app.copyFolderRecursiveSync as Mock).mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('should integrate with fs to check if source exists', async () => {
    const from = './source.txt';
    const to = './destination.txt';
    const options: CopyOptions = {
      quiet: false
    };
    const mockCallback = vi.fn();

    await copy(from, to, options, mockCallback);

    expect(fs.existsSync).toHaveBeenCalledWith(from);
  });

  it('should integrate with fs to check if source is a directory', async () => {
    const from = './source.txt';
    const to = './destination.txt';
    const options: CopyOptions = {
      quiet: false
    };
    const mockCallback = vi.fn();

    await copy(from, to, options, mockCallback);

    expect(fs.lstatSync).toHaveBeenCalledWith(from);
  });

  it('should integrate with app.copyFileSync for file copying', async () => {
    const from = './source.txt';
    const to = './destination.txt';
    const options: CopyOptions = {
      quiet: false
    };
    const mockCallback = vi.fn();

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
    const mockCallback = vi.fn();

    (fs.lstatSync as Mock).mockReturnValue({
      isDirectory: vi.fn().mockReturnValue(true)
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
    const mockCallback = vi.fn();

    (fs.existsSync as Mock).mockReturnValue(false);

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
    const mockCallback = vi.fn();

    const errorMessage = 'Permission denied';
    (app.copyFileSync as Mock).mockImplementation(() => {
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
    const mockCallback = vi.fn();

    (fs.lstatSync as Mock).mockReturnValue({
      isDirectory: vi.fn().mockReturnValue(true)
    });

    const errorMessage = 'Permission denied';
    (app.copyFolderRecursiveSync as Mock).mockImplementation(() => {
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
    const mockCallback = vi.fn();

    await copy(from, to, options, mockCallback);

    const logCallOrder = (log.log as Mock).mock.invocationCallOrder[0];
    const copyCallOrder = (app.copyFileSync as Mock).mock.invocationCallOrder[0];

    expect(logCallOrder).toBeLessThan(copyCallOrder);
  });
});