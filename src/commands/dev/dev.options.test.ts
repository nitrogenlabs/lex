import {execa} from 'execa';

import {dev} from './dev.js';

vi.mock('execa');
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  createSpinner: vi.fn(() => ({
    start: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn()
  })),
  removeFiles: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('../../utils/file.js', async () => ({
  ...await vi.importActual('../../utils/file.js'),
  getDirName: vi.fn(() => '/mock/dir'),
  resolveBinaryPath: vi.fn(() => '/mock/path/to/webpack-cli'),
  resolveWebpackPaths: vi.fn(() => ({
    webpackConfig: '/mock/path/to/webpack.config.js',
    webpackPath: '/mock/path/to/webpack-cli'
  }))
}));
vi.mock('../../utils/log.js');
vi.mock('../../LexConfig.js', async () => ({
  LexConfig: {
    checkTypescriptConfig: vi.fn(),
    config: {
      outputFullPath: '/mock/output',
      useTypescript: false
    },
    parseConfig: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('dev options', () => {
  let consoleLogSpy: SpyInstance;

  beforeAll(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('should start dev server with default options', async () => {
    const mockChildProcess = {
      on: vi.fn(),
      stderr: {on: vi.fn()},
      stdout: {on: vi.fn()}
    };
    (execa as MockedFunction<typeof execa>).mockReturnValue(mockChildProcess as any);

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
      on: vi.fn(),
      stderr: {on: vi.fn()},
      stdout: {on: vi.fn()}
    };
    (execa as MockedFunction<typeof execa>).mockReturnValue(mockChildProcess as any);

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