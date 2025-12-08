import {execa} from 'execa';

import {migrate} from './migrate.js';

jest.mock('execa');
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn()
  })),
  removeFiles: jest.fn().mockResolvedValue(undefined),
  removeModules: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js');

describe('migrate cli', () => {
  let processExitSpy: jest.SpyInstance;

  beforeAll(() => {
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
  });

  afterAll(() => {
    processExitSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('should migrate with default options', async () => {
    const result = await migrate({});

    expect(result).toBe(0);
  });

  it('should migrate with quiet option', async () => {
    const result = await migrate({quiet: true});

    expect(result).toBe(0);
  });

  it('should migrate with cliName option', async () => {
    const result = await migrate({cliName: 'CustomCLI'});

    expect(result).toBe(0);
  });
});