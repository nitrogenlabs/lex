import {copy} from './copy.js';

vi.mock('execa');
vi.mock('fs', async () => ({
  existsSync: vi.fn(() => true),
  lstatSync: vi.fn(() => ({
    isDirectory: vi.fn(() => false)
  }))
}));
vi.mock('glob', async () => ({
  sync: vi.fn(() => [])
}));
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

describe('copy cli', () => {
  let consoleLogSpy;

  beforeAll(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('should copy files successfully', async () => {
    const mockCallback = vi.fn();
    const {copyFileSync} = require('../../utils/app.js');

    const result = await copy('./source.txt', './dest.txt', {}, mockCallback);

    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
    expect(copyFileSync).toHaveBeenCalledWith('./source.txt', './dest.txt');
  });
});