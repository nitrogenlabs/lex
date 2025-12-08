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

describe('link options', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('should handle default options', async () => {
    const result = await linked({});

    expect(result).toBe(0);
  });

  it('should handle quiet option', async () => {
    const result = await linked({quiet: true});

    expect(result).toBe(0);
  });

  it('should handle cliName option', async () => {
    const result = await linked({cliName: 'CustomCLI'});

    expect(result).toBe(0);
  });
});