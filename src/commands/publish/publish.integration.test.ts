import {execa} from 'execa';

import {publish} from './publish.js';

vi.mock('execa');
vi.mock('../../utils/app.js', async () => ({
  createSpinner: vi.fn(() => ({
    start: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn()
  })),
  getPackageJson: vi.fn(() => ({
    dependencies: {},
    devDependencies: {},
    name: 'test-package',
    version: '1.0.0'
  })),
  setPackageJson: vi.fn()
}));
vi.mock('../../utils/log.js');
vi.mock('../../LexConfig.js');
vi.mock('fs');
vi.mock('path');

describe('publish integration', () => {
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

  it('should publish successfully', async () => {
    (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
    await publish({});

    expect(execa).toHaveBeenCalled();
  });

  it('should handle publish errors', async () => {
    (execa as MockedFunction<typeof execa>).mockRejectedValueOnce(new Error('Publish failed'));
    const result = await publish({});

    expect(result).toBe(1);
  });
});