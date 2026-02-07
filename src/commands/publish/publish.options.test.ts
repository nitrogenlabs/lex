import {execa} from 'execa';

import {publish} from './publish.js';

vi.mock('execa');
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  createSpinner: vi.fn(() => ({
    start: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn()
  }))
}));
vi.mock('../../utils/log.js');
vi.mock('../../LexConfig.js');

describe('publish options', () => {
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

  it('should publish with default options', async () => {
    (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
    await publish({});

    expect(execa).toHaveBeenCalled();
  });
});