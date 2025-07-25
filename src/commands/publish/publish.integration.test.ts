import {execa} from 'execa';

import {publish} from './publish.js';

jest.mock('execa');
jest.mock('../../utils/app.js', () => ({
  createSpinner: jest.fn(() => ({
    start: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn()
  })),
  getPackageJson: jest.fn(() => ({
    name: 'test-package',
    version: '1.0.0',
    dependencies: {},
    devDependencies: {}
  })),
  setPackageJson: jest.fn()
}));
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js');
jest.mock('fs');
jest.mock('path');

describe('publish integration', () => {
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

  it('should publish successfully', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({stdout: '', stderr: '', exitCode: 0} as any);
    await publish({});

    expect(execa).toHaveBeenCalled();
  });

  it('should handle publish errors', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockRejectedValueOnce(new Error('Publish failed'));
    const result = await publish({});

    expect(result).toBe(1);
  });
});