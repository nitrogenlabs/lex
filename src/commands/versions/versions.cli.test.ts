import {jsonVersions, packages, versions} from './versions.js';

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

describe('versions.cli', () => {
  const mockExit = vi.fn();
  const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

  beforeEach(() => {
    mockExit.mockClear();
    mockConsoleLog.mockClear();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('should display versions in text format by default', async () => {
    await versions({}, mockExit);

    expect(mockConsoleLog).not.toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should display versions in JSON format when json option is true', async () => {
    await versions({json: true}, mockExit);

    expect(mockConsoleLog).toHaveBeenCalledWith(JSON.stringify(jsonVersions(packages)));
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should return 0 as exit code', async () => {
    const result = await versions({}, mockExit);

    expect(result).toBe(0);
    expect(mockExit).toHaveBeenCalledWith(0);
  });
});