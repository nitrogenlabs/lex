import {execa} from 'execa';

import {migrate} from './migrate.js';

vi.mock('execa');
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  createSpinner: vi.fn(() => ({
    start: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn()
  })),
  removeFiles: vi.fn().mockResolvedValue(undefined),
  removeModules: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('../../utils/log.js');
vi.mock('../../LexConfig.js');

describe('migrate options', () => {
  let processExitSpy: SpyInstance;

  beforeAll(() => {
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    processExitSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('should migrate with default options', async () => {
    (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
    await migrate({});

    expect(execa).toHaveBeenCalled();
  });
});