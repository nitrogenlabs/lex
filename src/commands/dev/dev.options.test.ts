import {execa} from 'execa';

import {LexConfig} from '../../LexConfig.js';
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
      dev: {},
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
    (LexConfig.config as any).dev = {};
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

  it('should use dev.port from lex config when --port is not provided', async () => {
    (LexConfig.config as any).dev = {port: 4200};

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

    expect(execa).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      expect.objectContaining({
        env: expect.objectContaining({
          WEBPACK_DEV_PORT: '4200'
        })
      })
    );
  });

  it('should prefer --port over dev.port from lex config', async () => {
    (LexConfig.config as any).dev = {port: 4200};

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

    await dev({port: 8080});

    expect(execa).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      expect.objectContaining({
        env: expect.objectContaining({
          WEBPACK_DEV_PORT: '8080'
        })
      })
    );
  });
});
