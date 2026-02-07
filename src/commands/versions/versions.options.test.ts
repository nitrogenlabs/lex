import {VersionsCmd} from './versions.js';

vi.mock('execa');
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  createSpinner: vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn()
  }))
}));

describe('versions.options', () => {
  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('should have the correct options structure', () => {
    const options: VersionsCmd = {
      json: true
    };

    expect(options).toHaveProperty('json');
    expect(options.json).toBe(true);
  });

  it('should allow empty options', () => {
    const options: VersionsCmd = {};

    expect(options).toEqual({});
    expect(options.json).toBeUndefined();
  });
});