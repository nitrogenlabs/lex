import {clean} from './clean.js';

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
vi.mock('../../LexConfig.js', async () => ({
  LexConfig: {
    parseConfig: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('clean options', () => {
  let consoleLogSpy;

  beforeAll(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('should handle default options', async () => {
    const result = await clean({});

    expect(result).toBe(0);
  });

  it('should handle quiet option', async () => {
    const {createSpinner} = require('../../utils/app.js');
    const result = await clean({quiet: true});

    expect(result).toBe(0);
    expect(createSpinner).toHaveBeenCalledWith(true);
  });

  it('should handle snapshots option', async () => {
    const {removeFiles} = require('../../utils/app.js');
    const result = await clean({snapshots: true});

    expect(result).toBe(0);
    expect(removeFiles).toHaveBeenCalledWith('./**/__snapshots__', true);
  });
});