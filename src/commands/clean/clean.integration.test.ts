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

describe('clean integration', () => {
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