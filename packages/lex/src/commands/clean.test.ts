import {clean} from './clean';
import {LexConfig, defaultConfigValues} from '../LexConfig.js';
import {removeFiles, removeModules} from '../utils/app.js';

jest.mock('../utils/app', () => ({
  ...jest.requireActual('../utils/app'),
  removeFiles: jest.fn(() => Promise.resolve()),
  removeModules: jest.fn(() => Promise.resolve())
}));

jest.mock('../LexConfig', () => ({
  LexConfig: {
    config: {},
    checkTypescriptConfig: jest.fn(),
    parseConfig: jest.fn()
  }
}));

describe('clean', () => {
  let callback: jest.Mock;
  let oldConsole;

  beforeAll(() => {
    oldConsole = {...console};
    console = {
      ...oldConsole,
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };
  });

  beforeEach(() => {
    callback = jest.fn();
    LexConfig.config = {
      ...defaultConfigValues
    };
  });

  afterAll(() => {
    console = {...oldConsole};
    jest.resetAllMocks();
  });

  it('should clean using default config', async () => {
    const status: number = await clean({}, callback);
    expect(LexConfig.parseConfig).toHaveBeenCalled();
    expect(removeFiles).toHaveBeenCalled();
    expect(removeModules).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(0);
    expect(status).toBe(0);
  });

  it('should clean using config', async () => {
    const status: number = await clean({
      snapshots: true
    }, callback);
    expect(LexConfig.parseConfig).toHaveBeenCalled();
    expect(removeFiles).toHaveBeenCalled();
    expect(removeModules).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(0);
    expect(status).toBe(0);
  });

  it('should error on removing files', async () => {
    (removeFiles as jest.Mock).mockImplementation(() => Promise.reject(new Error('Remove Error')));
    const status: number = await clean({}, callback);
    expect(callback).toHaveBeenCalledWith(1);
    expect(status).toBe(1);
  });
});
