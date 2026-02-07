import {execa} from 'execa';

import {dev} from './dev.js';

vi.mock('execa');
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  createSpinner: vi.fn(() => ({
    start: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn()
  }))
}));
vi.mock('../../utils/file.js', async () => ({
  ...await vi.importActual('../../utils/file.js'),
  resolveWebpackPaths: vi.fn(() => ({
    webpackConfig: '/mock/path/to/webpack.config.js',
    webpackPath: '/mock/path/to/webpack-cli'
  }))
}));
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

describe('dev integration', () => {
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

  it('should start development server successfully', async () => {
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

    const result = await dev({});

    expect(execa).toHaveBeenCalledWith(expect.stringContaining('webpack-cli'), ['--color', '--watch', '--config', expect.any(String)], expect.any(Object));
  });

  it('should handle server startup errors', async () => {
    (execa as MockedFunction<typeof execa>).mockRejectedValueOnce(new Error('Server failed to start'));
    const result = await dev({});

    expect(result).toBe(1);
  });
});