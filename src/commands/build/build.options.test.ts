jest.mock('execa');
jest.mock('fs');
jest.mock('path');
jest.mock('glob', () => ({
  ...jest.requireActual('glob'),
  sync: jest.fn(() => [])
}));
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn(),
  })),
}));

import {execa} from 'execa';
import {build} from './build.js';

describe('build options', () => {
  let consoleLogSpy;
  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterAll(() => {
    consoleLogSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('should build with default options', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({stdout: '', stderr: '', exitCode: 0} as any);
    await build({});
    expect(execa).toHaveBeenCalled();
  });
});
