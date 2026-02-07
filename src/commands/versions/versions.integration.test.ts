import {jsonVersions, packages, parseVersion, versions} from './versions.js';
import {log} from '../../utils/log.js';


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

describe('versions.integration', () => {
  const mockExit = vi.fn();
  const mockLog = log as MockedFunction<typeof log>;
  const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

  beforeEach(() => {
    mockExit.mockClear();
    mockLog.mockClear();
    mockConsoleLog.mockClear();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('should parse version correctly', () => {
    expect(parseVersion('^1.0.0')).toBe('1.0.0');
    expect(parseVersion('1.0.0')).toBe('1.0.0');
    expect(parseVersion('^1.2.3')).toBe('1.2.3');
    expect(parseVersion(undefined as unknown as string)).toBe('N/A');
  });

  it('should create JSON versions correctly', () => {
    const mockPackages = {
      swc: '1.0.0',
      vitest: '2.0.0'
    };

    const result = jsonVersions(mockPackages);

    expect(result).toEqual({
      swc: packages.swc,
      vitest: packages.vitest
    });
  });

  it('should log versions in text format', async () => {
    await versions({}, mockExit);

    expect(mockLog).toHaveBeenCalledWith('Versions:', 'info', false);
    expect(mockLog).toHaveBeenCalledWith(`  Lex: ${packages.lex}`, 'info', false);
    expect(mockLog).toHaveBeenCalledWith('  ----------', 'note', false);
    expect(mockLog).toHaveBeenCalledWith(`  SWC: ${packages.swc}`, 'info', false);
    expect(mockLog).toHaveBeenCalledWith(`  Vitest: ${packages.vitest}`, 'info', false);
    expect(mockLog).toHaveBeenCalledWith(`  Typescript: ${packages.typescript}`, 'info', false);
    expect(mockLog).toHaveBeenCalledWith(`  Webpack: ${packages.webpack}`, 'info', false);
  });
});
