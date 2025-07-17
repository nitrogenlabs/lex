import {UpdateOptions} from './update.js';

jest.mock('execa');
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    start: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn()
  }))
}));

describe('update.options', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should have the correct options structure', () => {
    const options: UpdateOptions = {
      cliName: 'TestCLI',
      interactive: true,
      packageManager: 'npm',
      quiet: false,
      registry: 'https://registry.npmjs.org'
    };

    expect(options).toHaveProperty('cliName');
    expect(options).toHaveProperty('interactive');
    expect(options).toHaveProperty('packageManager');
    expect(options).toHaveProperty('quiet');
    expect(options).toHaveProperty('registry');
  });

  it('should allow partial options', () => {
    const options: UpdateOptions = {
      packageManager: 'yarn'
    };

    expect(options).toHaveProperty('packageManager', 'yarn');
    expect(options.cliName).toBeUndefined();
    expect(options.interactive).toBeUndefined();
    expect(options.quiet).toBeUndefined();
    expect(options.registry).toBeUndefined();
  });

  it('should allow empty options', () => {
    const options: UpdateOptions = {};

    expect(options).toEqual({});
  });
});