import {existsSync, readdirSync} from 'fs';

import {compile, hasFileType} from './compile.js';
import {LexConfig, defaultConfigValues} from '../LexConfig.js';
import {checkLinkedModules, removeFiles} from '../utils/app.js';

jest.mock('execa', () => ({
  ...jest.requireActual('execa'),
  execa: jest.fn(() => Promise.resolve({}))
}));

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(() => true),
  lstatSync: jest.fn(() => ({
    isDirectory: jest.fn(() => false)
  })),
  readdirSync: jest.fn(() => [])
}));

jest.mock('../utils/app', () => ({
  ...jest.requireActual('../utils/app'),
  checkLinkedModules: jest.fn(),
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

describe('compile', () => {
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
    const status: number = await compile({}, callback);
    expect(checkLinkedModules).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(0);
    expect(status).toBe(0);
  });

  it('should clean using config', async () => {
    LexConfig.config = {
      ...LexConfig.config,
      useTypescript: true
    };
    const status: number = await compile({
      remove: true
    }, callback);
    expect(checkLinkedModules).toHaveBeenCalled();
    expect(removeFiles).toHaveBeenCalled();
    expect(LexConfig.checkTypescriptConfig).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(0);
    expect(status).toBe(0);
  });

  describe('hasFileType', () => {
    const filePath = './';

    it('should return false if path does not exist', () => {
      (existsSync as jest.Mock).mockImplementation(() => false);
      const status: boolean = hasFileType(filePath, ['.js']);
      expect(status).toBe(false);
    });

    it('should return true if path has file type', () => {
      (existsSync as jest.Mock).mockImplementation(() => true);
      (readdirSync as jest.Mock).mockImplementation(() => ['test.js']);
      const status: boolean = hasFileType(filePath, ['.js']);
      expect(status).toBe(true);
    });

    it('should return false if path does not have file type', () => {
      (existsSync as jest.Mock).mockImplementation(() => true);
      (readdirSync as jest.Mock).mockImplementation(() => ['test.css']);
      const status: boolean = hasFileType(filePath, ['.js']);
      expect(status).toBe(false);
    });
  });
});
