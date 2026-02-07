import {linked} from './link.js';

vi.mock('execa');
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  createSpinner: vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn()
  }))
}));

describe('link cli', () => {
  let consoleLogSpy: SpyInstance;

  beforeAll(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('should link modules with default options', async () => {
    const result = await linked({});

    expect(result).toBe(0);
  });

  it('should link modules with quiet option', async () => {
    const result = await linked({quiet: true});

    expect(result).toBe(0);
  });

  it('should link modules with cliName option', async () => {
    const result = await linked({cliName: 'CustomCLI'});

    expect(result).toBe(0);
  });
});