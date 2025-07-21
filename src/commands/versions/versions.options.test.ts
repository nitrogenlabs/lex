import {VersionsCmd} from './versions.js';

jest.mock('execa');
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn()
  }))
}));

describe('versions.options', () => {
  afterAll(() => {
    jest.restoreAllMocks();
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