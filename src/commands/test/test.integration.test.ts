import {execa} from 'execa';

import {test, type TestCallback} from './test.js';

jest.mock('execa');
jest.mock('../ai/ai.js', () => ({
  aiFunction: jest.fn()
}));
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    start: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn()
  }))
}));
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js', () => ({
  LexConfig: {
    parseConfig: jest.fn().mockResolvedValue(undefined),
    config: {
      useTypescript: true
    },
    checkTypescriptConfig: jest.fn(),
    checkTestTypescriptConfig: jest.fn(),
    getLexDir: jest.fn(() => '/mock/lex/dir')
  },
  getTypeScriptConfigPath: jest.fn(() => 'tsconfig.test.json'),
  getLexDir: jest.fn(() => '/mock/lex/dir')
}));
jest.mock('../../utils/file.js', () => ({
  getDirName: jest.fn(() => '/mock/dir'),
  resolveBinaryPath: jest.fn(() => '/mock/path/to/jest'),
  relativeNodePath: jest.fn(() => '/node_modules/jest-cli/bin/jest.js')
}));
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => '{"type": "module"}')
}));
jest.mock('glob', () => ({
  sync: jest.fn(() => [])
}));
jest.mock('path');
jest.mock('url');

describe('test integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should run tests successfully', async () => {
    const callback = jest.fn() as unknown as TestCallback;
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({stdout: '', stderr: '', exitCode: 0} as any);

    await test({}, [], callback);

    expect(execa).toHaveBeenCalled();
  });

  it('should handle test errors', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockRejectedValueOnce(new Error('AI service unavailable'));
    const callback = jest.fn() as unknown as TestCallback;
    const result = await test({}, [], callback);

    expect(result).toBe(1);
  });
});