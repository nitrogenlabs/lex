import {execa} from 'execa';

import {migrate} from './migrate.js';

jest.mock('execa');
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    start: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn()
  })),
  removeModules: jest.fn().mockResolvedValue(undefined),
  removeFiles: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js');

describe('migrate options', () => {
  let processExitSpy: jest.SpyInstance;

  beforeAll(() => {
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    processExitSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('should migrate with default options', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({stdout: '', stderr: '', exitCode: 0} as any);
    await migrate({});

    expect(execa).toHaveBeenCalled();
  });
});