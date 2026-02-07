import {execa} from 'execa';

import {update, UpdateCallback} from './update.js';

vi.mock('execa');
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  createSpinner: vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn()
  }))
}));
vi.mock('../../utils/log.js');
vi.mock('../../LexConfig.js');
vi.mock('../../utils/file.js', async () => ({
  getDirName: vi.fn(() => '/mock/dir')
}));

describe('update integration', () => {
  const mockCallback = vi.fn() as unknown as MockedFunction<UpdateCallback>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('should update successfully', async () => {
    (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
    await update({}, mockCallback);

    expect(execa).toHaveBeenCalled();
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should handle update errors', async () => {
    (execa as MockedFunction<typeof execa>).mockRejectedValue(new Error('Failed to update'));
    const result = await update({}, mockCallback);

    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });
});