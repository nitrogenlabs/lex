import {execa} from 'execa';

import {migrate} from './migrate.js';

vi.mock('execa');
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  createSpinner: vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn()
  })),
  removeFiles: vi.fn().mockResolvedValue(undefined),
  removeModules: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('../../utils/log.js');
vi.mock('../../LexConfig.js');

describe('migrate cli', () => {
  let processExitSpy: SpyInstance;

  beforeAll(() => {
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
  });

  afterAll(() => {
    processExitSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('should migrate with default options', async () => {
    const result = await migrate({});

    expect(result).toBe(0);
  });

  it('should migrate with quiet option', async () => {
    const result = await migrate({quiet: true});

    expect(result).toBe(0);
  });

  it('should migrate with cliName option', async () => {
    const result = await migrate({cliName: 'CustomCLI'});

    expect(result).toBe(0);
  });
});