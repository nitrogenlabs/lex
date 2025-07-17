import {execa} from 'execa';

import {lint} from './lint.js';

jest.mock('execa');
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    start: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn()
  }))
}));

describe('lint cli', () => {
  let processExitSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeAll(() => {
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    processExitSpy.mockRestore();
    consoleLogSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('should lint with default options', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({stdout: '', stderr: '', exitCode: 0} as any);
    await lint({});

    expect(execa).toHaveBeenCalledWith(expect.stringContaining('eslint'), expect.arrayContaining(['src/**/*.{js,jsx}']), expect.any(Object));
  });

  it('should lint with fix option', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({stdout: '', stderr: '', exitCode: 0} as any);
    await lint({fix: true});

    expect(execa).toHaveBeenCalledWith(expect.stringContaining('eslint'), expect.arrayContaining(['--fix']), expect.any(Object));
  });

  it('should lint with custom config', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({stdout: '', stderr: '', exitCode: 0} as any);
    await lint({config: 'eslint.config.js'});

    expect(execa).toHaveBeenCalledWith(expect.stringContaining('eslint'), expect.arrayContaining(['--config']), expect.any(Object));
  });

  it('should lint with quiet option', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({stdout: '', stderr: '', exitCode: 0} as any);
    await lint({quiet: true});

    expect(execa).toHaveBeenCalledWith(expect.stringContaining('eslint'), expect.arrayContaining(['src/**/*.{js,jsx}']), expect.any(Object));
  });
});