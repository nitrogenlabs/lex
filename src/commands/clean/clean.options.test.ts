import {clean} from './clean.js';

jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn()
  })),
  removeModules: jest.fn().mockResolvedValue(undefined),
  removeFiles: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js', () => ({
  LexConfig: {
    parseConfig: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('clean options', () => {
  let consoleLogSpy;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('should handle default options', async () => {
    const result = await clean({});

    expect(result).toBe(0);
  });

  it('should handle quiet option', async () => {
    const {createSpinner} = require('../../utils/app.js');
    const result = await clean({quiet: true});

    expect(result).toBe(0);
    expect(createSpinner).toHaveBeenCalledWith(true);
  });

  it('should handle snapshots option', async () => {
    const {removeFiles} = require('../../utils/app.js');
    const result = await clean({snapshots: true});

    expect(result).toBe(0);
    expect(removeFiles).toHaveBeenCalledWith('./**/__snapshots__', true);
  });
});