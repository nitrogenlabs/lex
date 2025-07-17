import {UpgradeOptions} from './upgrade.js';

jest.mock('execa');
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn()
  }))
}));

describe('upgrade.options', () => {
  afterAll(() => {
    jest.restoreAllMocks();
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
