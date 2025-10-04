import {copy} from './copy.js';

jest.mock('execa');
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  lstatSync: jest.fn(() => ({
    isDirectory: jest.fn(() => false)
  }))
}));
jest.mock('glob', () => ({
  sync: jest.fn(() => [])
}));
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

describe('copy options', () => {
  let consoleLogSpy;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('should copy with options', async () => {
    const mockCallback = jest.fn();
    const {copyFileSync} = require('../../utils/app.js');

    const result = await copy('./source.txt', './dest.txt', {quiet: true}, mockCallback);

    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
    expect(copyFileSync).toHaveBeenCalledWith('./source.txt', './dest.txt');
  });
});