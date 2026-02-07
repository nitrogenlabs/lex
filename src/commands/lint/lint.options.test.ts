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
vi.mock('../../utils/log.js');
vi.mock('../../LexConfig.js');
vi.mock('fs', async () => ({
  existsSync: vi.fn(() => true),
  readFileSync: vi.fn(() => '{"type": "module"}'),
  unlinkSync: vi.fn(),
  writeFileSync: vi.fn()
}));
vi.mock('path', async () => ({
  dirname: vi.fn(() => '/mock/dir'),
  resolve: vi.fn((...args) => args.join('/'))
}));
vi.mock('glob', async () => ({
  sync: vi.fn()
}));

describe('lint options', () => {
  let processExitSpy: SpyInstance;
  let consoleLogSpy: SpyInstance;

  beforeAll(() => {
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
  });

  afterAll(() => {
    processExitSpy.mockRestore();
    consoleLogSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('should handle default options', async () => {
    const result = await lint({});

    expect(result).toBe(0);
  });

  it('should handle fix option', async () => {
    const result = await lint({fix: true});

    expect(result).toBe(0);
  });

  it('should handle config option', async () => {
    const result = await lint({config: 'eslint.config.mjs'});

    expect(result).toBe(0);
  });

  it('should handle quiet option', async () => {
    const result = await lint({quiet: true});

    expect(result).toBe(0);
  });

  it('should handle debug option', async () => {
    const result = await lint({debug: true});

    expect(result).toBe(0);
  });

  it('should handle noColor option', async () => {
    const result = await lint({noColor: true});

    expect(result).toBe(0);
  });

  it('should handle cliName option', async () => {
    const result = await lint({cliName: 'CustomLinter'});

    expect(result).toBe(0);
  });
});