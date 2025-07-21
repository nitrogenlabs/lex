import {execa} from 'execa';

import {dev} from './dev.js';

jest.mock('execa');
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    start: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn()
  })),
  removeFiles: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../../utils/file.js', () => ({
  ...jest.requireActual('../../utils/file.js'),
  getDirName: jest.fn(() => '/mock/dir'),
  resolveBinaryPath: jest.fn(() => '/mock/path/to/webpack-cli'),
  resolveWebpackPaths: jest.fn(() => ({
    webpackPath: '/mock/path/to/webpack-cli',
    webpackConfig: '/mock/path/to/webpack.config.js'
  }))
}));
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js', () => ({
  LexConfig: {
    parseConfig: jest.fn().mockResolvedValue(undefined),
    config: {
      outputFullPath: '/mock/output',
      useTypescript: false
    },
    checkTypescriptConfig: jest.fn()
  }
}));

describe('dev options', () => {
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

  it('should start dev server with default options', async () => {
    const mockChildProcess = {
      stdout: {on: jest.fn()},
      stderr: {on: jest.fn()},
      on: jest.fn()
    };
    (execa as jest.MockedFunction<typeof execa>).mockReturnValue(mockChildProcess as any);

    mockChildProcess.on.mockImplementation((event, callback) => {
      if(event === 'close') {
        setTimeout(() => callback(0), 10);
      }
      return mockChildProcess;
    });

    await dev({});

    expect(execa).toHaveBeenCalled();
  });

  it('should start dev server with usePublicIp option', async () => {
    const mockChildProcess = {
      stdout: {on: jest.fn()},
      stderr: {on: jest.fn()},
      on: jest.fn()
    };
    (execa as jest.MockedFunction<typeof execa>).mockReturnValue(mockChildProcess as any);

    mockChildProcess.on.mockImplementation((event, callback) => {
      if(event === 'close') {
        setTimeout(() => callback(0), 10);
      }
      return mockChildProcess;
    });

    await dev({usePublicIp: true});

    expect(execa).toHaveBeenCalled();
  });
});