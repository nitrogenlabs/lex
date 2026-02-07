import {clean} from './clean.js';

vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  createSpinner: vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn()
  })),
  removeFiles: vi.fn().mockResolvedValue(undefined),
  removeModules: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('../../utils/log.js');
vi.mock('../../LexConfig.js', async () => ({
  LexConfig: {
    parseConfig: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('clean integration', () => {
  let consoleLogSpy;

  beforeAll(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clean the project successfully', async () => {
    const {removeModules, removeFiles} = require('../../utils/app.js');
    const result = await clean({});

    expect(result).toBe(0);
    expect(removeModules).toHaveBeenCalled();
    expect(removeFiles).toHaveBeenCalledWith('./coverage', true);
    expect(removeFiles).toHaveBeenCalledWith('./npm-debug.log', true);
  });

  it('should handle cleaning errors', async () => {
    const {removeModules} = require('../../utils/app.js');
    removeModules.mockRejectedValueOnce(new Error('Failed to remove files'));

    const result = await clean({});

    expect(result).toBe(1);
  });

  it('should clean with snapshots option', async () => {
    const {removeFiles} = require('../../utils/app.js');
    const result = await clean({snapshots: true});

    expect(result).toBe(0);
    expect(removeFiles).toHaveBeenCalledWith('./**/__snapshots__', true);
  });
});