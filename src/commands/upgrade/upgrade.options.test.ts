import {UpgradeOptions} from './upgrade.js';

vi.mock('execa');
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  createSpinner: vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn()
  }))
}));

describe('upgrade.options', () => {
  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('should have the correct options structure', () => {
    const options: UpgradeOptions = {
      cliName: 'TestCLI',
      cliPackage: '@custom/cli',
      quiet: false
    };

    expect(options).toHaveProperty('cliName');
    expect(options).toHaveProperty('cliPackage');
    expect(options).toHaveProperty('quiet');
  });

  it('should allow partial options', () => {
    const options: UpgradeOptions = {
      cliPackage: '@custom/cli'
    };

    expect(options).toHaveProperty('cliPackage', '@custom/cli');
    expect(options.cliName).toBeUndefined();
    expect(options.quiet).toBeUndefined();
  });

  it('should allow empty options', () => {
    const options: UpgradeOptions = {};

    expect(options).toEqual({});
  });
});
