import {execa} from 'execa';

import {dev} from './dev.js';

vi.mock('execa');
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  createSpinner: vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn()
  }))
}));

describe('dev cli', () => {
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
    (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
    await dev({});

    expect(execa).toHaveBeenCalledWith(
      'node',
      [expect.stringContaining('webpack-cli/bin/cli.js'), '--color', '--watch', '--config', expect.any(String)],
      expect.any(Object)
    );
  });

  it('should start dev server with usePublicIp option', async () => {
    (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
    await dev({usePublicIp: true});

    expect(execa).toHaveBeenCalledWith(
      'node',
      [expect.stringContaining('webpack-cli/bin/cli.js'), '--color', '--watch', '--config', expect.any(String)],
      expect.any(Object)
    );
  });

  it('should start dev server with custom port', async () => {
    (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
    await dev({port: 8080});

    expect(execa).toHaveBeenCalledWith(
      'node',
      [expect.stringContaining('webpack-cli/bin/cli.js'), '--color', '--watch', '--config', expect.any(String)],
      expect.objectContaining({
        env: expect.objectContaining({
          WEBPACK_DEV_PORT: '8080'
        })
      })
    );
  });
});