import {jsonVersions, packages, parseVersion, versions} from './versions.js';
import {log} from '../utils/log.js';

jest.mock('../utils/log', () => ({
  log: jest.fn()
}));

describe('versions', () => {
  let oldConsole;

  beforeAll(() => {
    oldConsole = {...console};
    console = {
      ...oldConsole,
      debug: jest.fn(),
      error: jest.fn(),
      log: jest.fn(),
      warn: jest.fn()
    };
  });

  afterAll(() => {
    console = {...oldConsole};
    jest.resetAllMocks();
  });

  it('should log correct versions', async () => {
    const callback = jest.fn();
    const status: number = await versions({json: false}, callback);
    expect(status).toBe(0);
    expect(callback).toHaveBeenCalledWith(0);
    expect(log).toHaveBeenCalledWith('Versions:', 'info', false);
  });

  it('should display correct versions in json format', async () => {
    const callback = jest.fn();
    const status: number = await versions({json: true}, callback);
    expect(status).toBe(0);
    expect(callback).toHaveBeenCalledWith(0);
    expect(log).toHaveBeenCalledWith('Versions:', 'info', false);
  });

  describe('jsonVersions', () => {
    it('should get package versions', async () => {
      const packageVersions = jsonVersions(packages);
      expect(packageVersions).toEqual(packages);
    });
  });

  describe('parseVersion', () => {
    it('should parse version', async () => {
      const version = parseVersion('^1.5.0');
      expect(version).toEqual('1.5.0');
    });
  });
});
