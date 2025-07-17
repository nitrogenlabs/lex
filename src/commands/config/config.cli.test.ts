import {config} from './config.js';

jest.mock('fs', () => ({
  writeFileSync: jest.fn()
}));
jest.mock('glob', () => ({
  sync: jest.fn(() => [])
}));
jest.mock('path', () => ({
  relative: jest.fn(() => 'relative/path')
}));
jest.mock('../../LexConfig.js', () => ({
  LexConfig: {
    parseConfig: jest.fn().mockResolvedValue(undefined),
    config: {
      useTypescript: true,
      sourcePath: './src',
      outputPath: './dist'
    }
  }
}));
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    start: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn()
  }))
}));
jest.mock('../../utils/log.js');

describe('config cli', () => {
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

  it('should display app config with default options', async () => {
    const result = await config('app', {});

    expect(result).toBe(0);
  });


  it('should display config with quiet option', async () => {
    const result = await config('app', {quiet: true});

    expect(result).toBe(0);
  });

  it('should display config with json option', async () => {
    const {writeFileSync} = require('fs');
    const result = await config('app', {json: 'config.json'});

    expect(result).toBe(0);
    expect(writeFileSync).toHaveBeenCalledWith('config.json', expect.any(String));
  });

  it('should handle invalid config type', async () => {
    const result = await config('invalid', {});

    expect(result).toBe(1);
  });
});