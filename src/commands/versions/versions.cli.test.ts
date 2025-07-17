import {jsonVersions, packages, versions} from './versions.js';

jest.mock('execa');
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    start: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn()
  }))
}));
jest.mock('../../utils/log.js');

describe('versions.cli', () => {
  const mockExit = jest.fn();
  const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

  beforeEach(() => {
    mockExit.mockClear();
    mockConsoleLog.mockClear();
  });

  afterAll(() => {
    jest.restoreAllMocks();
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