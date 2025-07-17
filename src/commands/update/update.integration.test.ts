import {execa} from 'execa';

import {update, UpdateCallback} from './update.js';

jest.mock('execa');
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    start: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn()
  }))
}));
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/file.js', () => ({
  getDirName: jest.fn(() => '/mock/dir')
}));

describe('update integration', () => {
  const mockCallback = jest.fn() as unknown as jest.MockedFunction<UpdateCallback>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should update successfully', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({stdout: '', stderr: '', exitCode: 0} as any);
    await update({}, mockCallback);

    expect(execa).toHaveBeenCalled();
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should handle update errors', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockRejectedValue(new Error('Failed to update'));
    const result = await update({}, mockCallback);

    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });
});