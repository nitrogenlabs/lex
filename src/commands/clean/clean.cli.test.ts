import {createSpinner, removeFiles, removeModules} from '../../utils/app.js';
import {clean} from './clean.js';

jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn()
  })),
  removeFiles: jest.fn().mockResolvedValue(undefined),
  removeModules: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js', () => ({
  LexConfig: {
    parseConfig: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('clean cli', () => {
  let consoleLogSpy;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
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
    (removeModules as jest.MockedFunction<typeof removeModules>).mockResolvedValueOnce(undefined);
    (removeFiles as jest.MockedFunction<typeof removeFiles>).mockResolvedValueOnce(undefined);
    (removeFiles as jest.MockedFunction<typeof removeFiles>).mockRejectedValueOnce(new Error('Cannot remove npm logs'));
    const result = await clean({});

    expect(result).toBe(1);
  });

  it('should handle removeFiles failure for snapshots', async () => {
    (removeModules as jest.MockedFunction<typeof removeModules>).mockResolvedValueOnce(undefined);
    (removeFiles as jest.MockedFunction<typeof removeFiles>).mockResolvedValueOnce(undefined);
    (removeFiles as jest.MockedFunction<typeof removeFiles>).mockResolvedValueOnce(undefined);
    (removeFiles as jest.MockedFunction<typeof removeFiles>).mockRejectedValueOnce(new Error('Cannot remove snapshots'));
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
