import {execa} from 'execa';

import {test, type TestCallback} from './test.js';

jest.mock('execa');
jest.mock('../ai/ai.js', () => ({
  aiFunction: jest.fn()
}));
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn()
  }))
}));
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js', () => ({
  LexConfig: {
    checkTestTypescriptConfig: jest.fn(),
    checkTypescriptConfig: jest.fn(),
    config: {
      useTypescript: true
    },
    getLexDir: jest.fn(() => '/mock/lex/dir'),
    parseConfig: jest.fn().mockResolvedValue(undefined)
  },
  getTypeScriptConfigPath: jest.fn(() => 'tsconfig.test.json')
}));
jest.mock('../../utils/file.js', () => ({
  getDirName: jest.fn(() => '/mock/dir'),
  relativeNodePath: jest.fn(() => '/node_modules/jest-cli/bin/jest.js'),
  resolveBinaryPath: jest.fn(() => '/mock/path/to/jest')
}));
jest.mock('fs', () => ({
  existsSync: jest.fn((path: string) => {
    // Handle undefined or null paths
    if(!path) {
      return false;
    }

    return true;
  }),
  readFileSync: jest.fn((path: string) => {
    if(path.includes('package.json')) {
      return '{"type": "module", "scripts": {"test": "jest"}}';
    }
    return '{"type": "module"}';
  }),
  writeFileSync: jest.fn()
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