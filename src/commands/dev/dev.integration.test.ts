import {execa} from 'execa';

import {dev} from './dev.js';

jest.mock('execa');
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    start: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn()
  }))
}));
jest.mock('../../utils/file.js', () => ({
  ...jest.requireActual('../../utils/file.js'),
  resolveWebpackPaths: jest.fn(() => ({
    webpackConfig: '/mock/path/to/webpack.config.js',
    webpackPath: '/mock/path/to/webpack-cli'
  }))
}));
jest.mock('../../LexConfig.js', () => ({
  LexConfig: {
    checkTypescriptConfig: jest.fn(),
    config: {
      outputFullPath: '/mock/output',
      useTypescript: false
    },
    parseConfig: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('dev integration', () => {
  let consoleLogSpy: jest.SpyInstance;

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

  it('should start development server successfully', async () => {
    const mockChildProcess = {
      on: jest.fn(),
      stderr: {on: jest.fn()},
      stdout: {on: jest.fn()}
    };
    (execa as jest.MockedFunction<typeof execa>).mockReturnValue(mockChildProcess as any);

    mockChildProcess.on.mockImplementation((event, callback) => {
      if(event === 'close') {
        setTimeout(() => callback(0), 10);
      }
      return mockChildProcess;
    });

    const result = await dev({});

    expect(execa).toHaveBeenCalledWith(expect.stringContaining('webpack-cli'), ['--color', '--watch', '--config', expect.any(String)], expect.any(Object));
  });

  it('should handle server startup errors', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockRejectedValueOnce(new Error('Server failed to start'));
    const result = await dev({});

    expect(result).toBe(1);
  });
});