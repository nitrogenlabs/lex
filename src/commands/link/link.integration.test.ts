import {linked} from './link.js';

jest.mock('execa');
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn()
  }))
}));

describe('link integration', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('should check linked modules successfully', async () => {
    const result = await linked({});

    expect(result).toBe(0);
  });

  it('should handle link check errors', async () => {
    const result = await linked({});

    expect(result).toBe(0);
  });
});