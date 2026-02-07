import {clean} from './clean.js';
import {createSpinner, removeFiles, removeModules} from '../../utils/app.js';

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

describe('clean cli', () => {
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

  it('should clean node_modules successfully', async () => {
    await clean({});

    expect(removeModules).toHaveBeenCalled();
  });

  it('should clean coverage directory', async () => {
    await clean({});

    expect(removeFiles).toHaveBeenCalledWith('./coverage', true);
  });

  it('should clean npm debug logs', async () => {
    await clean({});

    expect(removeFiles).toHaveBeenCalledWith('./npm-debug.log', true);
  });

  it('should clean snapshots when snapshots option is true', async () => {
    await clean({snapshots: true});

    expect(removeFiles).toHaveBeenCalledWith('./**/__snapshots__', true);
  });

  it('should not clean snapshots when snapshots option is false', async () => {
    const {removeFiles} = require('../../utils/app.js');
    await clean({snapshots: false});
    const {calls} = removeFiles.mock;
    const snapshotCall = calls.find((call: any) => call[0].includes('__snapshots__'));

    expect(snapshotCall).toBeUndefined();
  });

  it('should handle removeModules failure', async () => {
    const {removeModules} = require('../../utils/app.js');
    removeModules.mockRejectedValueOnce(new Error('Permission denied'));
    const result = await clean({});

    expect(result).toBe(1);
  });

  it('should handle removeFiles failure for coverage', async () => {
    const {removeFiles} = require('../../utils/app.js');
    removeFiles.mockRejectedValueOnce(new Error('Cannot remove coverage'));
    const result = await clean({});

    expect(result).toBe(1);
  });

  it('should handle removeFiles failure for npm logs', async () => {
    (removeModules as MockedFunction<typeof removeModules>).mockResolvedValueOnce(undefined);
    (removeFiles as MockedFunction<typeof removeFiles>).mockResolvedValueOnce(undefined);
    (removeFiles as MockedFunction<typeof removeFiles>).mockRejectedValueOnce(new Error('Cannot remove npm logs'));
    const result = await clean({});

    expect(result).toBe(1);
  });

  it('should handle removeFiles failure for snapshots', async () => {
    (removeModules as MockedFunction<typeof removeModules>).mockResolvedValueOnce(undefined);
    (removeFiles as MockedFunction<typeof removeFiles>).mockResolvedValueOnce(undefined);
    (removeFiles as MockedFunction<typeof removeFiles>).mockResolvedValueOnce(undefined);
    (removeFiles as MockedFunction<typeof removeFiles>).mockRejectedValueOnce(new Error('Cannot remove snapshots'));
    const result = await clean({snapshots: true});

    expect(result).toBe(1);
  });

  it('should execute cleaning operations in correct order', async () => {
    await clean({});

    expect(removeModules).toHaveBeenCalled();
    expect(removeFiles).toHaveBeenCalled();
  });

  it('should handle general errors gracefully', async () => {
    const {removeModules} = require('../../utils/app.js');
    removeModules.mockRejectedValueOnce(new Error('Test error'));
    const result = await clean({});

    expect(result).toBe(1);
  });

  it('should work with quiet mode', async () => {
    await clean({quiet: true});

    expect(createSpinner).toHaveBeenCalledWith(true);
  });
});
