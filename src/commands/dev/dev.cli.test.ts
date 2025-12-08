import {execa} from 'execa';

import {dev} from './dev.js';

jest.mock('execa');
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn()
  }))
}));

describe('dev cli', () => {
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
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
    await dev({});

    expect(execa).toHaveBeenCalledWith(
      'node',
      [expect.stringContaining('webpack-cli/bin/cli.js'), '--color', '--watch', '--config', expect.any(String)],
      expect.any(Object)
    );
  });

  it('should start dev server with usePublicIp option', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
    await dev({usePublicIp: true});

    expect(execa).toHaveBeenCalledWith(
      'node',
      [expect.stringContaining('webpack-cli/bin/cli.js'), '--color', '--watch', '--config', expect.any(String)],
      expect.any(Object)
    );
  });

  it('should start dev server with custom port', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
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