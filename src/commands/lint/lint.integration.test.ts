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

describe('lint integration', () => {
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

  it('should lint successfully', async () => {
    (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
    const result = await lint({});

    expect(result).toBe(0);
    expect(execa).toHaveBeenCalledWith(expect.stringContaining('eslint'), expect.arrayContaining(['src/**/*.{js,jsx}']), expect.any(Object));
  });

  it('should handle linting errors', async () => {
    (execa as MockedFunction<typeof execa>).mockRejectedValueOnce(new Error('Linting failed'));
    const result = await lint({});

    expect(result).toBe(1);
  });
});