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
    start: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn()
  }))
}));
jest.mock('../../utils/log.js');

describe('copy cli', () => {
  let consoleLogSpy;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('should copy files successfully', async () => {
    const mockCallback = jest.fn();
    const {copyFileSync} = require('../../utils/app.js');

    const result = await copy('./source.txt', './dest.txt', {}, mockCallback);

    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
    expect(copyFileSync).toHaveBeenCalledWith('./source.txt', './dest.txt');
  });
});