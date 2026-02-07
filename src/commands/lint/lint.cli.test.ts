import {execa} from 'execa';

import {lint} from './lint.js';

vi.mock('execa');
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  createSpinner: vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn()
  }))
}));

describe('lint cli', () => {
  let processExitSpy: SpyInstance;
  let consoleLogSpy: SpyInstance;

  beforeAll(() => {
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    processExitSpy.mockRestore();
    consoleLogSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('should lint with default options', async () => {
    (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
    await lint({});

    expect(execa).toHaveBeenCalledWith(expect.stringContaining('eslint'), expect.arrayContaining(['src/**/*.{js,jsx}']), expect.any(Object));
  });

  it('should lint with fix option', async () => {
    (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
    await lint({fix: true});

    expect(execa).toHaveBeenCalledWith(expect.stringContaining('eslint'), expect.arrayContaining(['--fix']), expect.any(Object));
  });

  it('should lint with custom config', async () => {
    (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
    await lint({config: 'eslint.config.mjs'});

    expect(execa).toHaveBeenCalledWith(expect.stringContaining('eslint'), expect.arrayContaining(['--config']), expect.any(Object));
  });

  it('should lint with quiet option', async () => {
    (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
    await lint({quiet: true});

    expect(execa).toHaveBeenCalledWith(expect.stringContaining('eslint'), expect.arrayContaining(['src/**/*.{js,jsx}']), expect.any(Object));
  });
});