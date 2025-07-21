import {execa} from 'execa';
import {readFileSync} from 'fs';
import {sync as globSync} from 'glob';
import {existsSync} from 'node:fs';

import {test, TestCallback} from './test.js';
import {aiFunction} from '../ai/ai.js';

jest.mock('execa');
jest.mock('fs');
jest.mock('glob', () => ({sync: jest.fn(() => [])}));
jest.mock('node:fs');
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    start: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn()
  }))
}));
jest.mock('../../utils/log.js');
jest.mock('../ai/ai.js', () => ({
  aiFunction: jest.fn()
}));
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

describe('test command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (readFileSync as jest.Mock).mockReturnValue('{}');
    (existsSync as jest.Mock).mockReturnValue(true);
    (globSync as unknown as jest.Mock).mockReturnValue([]);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('runs Jest with default options', async () => {
    const callback = jest.fn() as unknown as TestCallback;
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);

    await test({}, [], callback);

    expect(execa).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(0);
  });

  it('propagates Jest errors', async () => {
    const callback = jest.fn() as unknown as TestCallback;
    (execa as jest.MockedFunction<typeof execa>).mockRejectedValue(new Error('Test failed'));

    await test({}, [], callback);

    expect(callback).toHaveBeenCalledWith(1);
  });

  describe('AI test generation', () => {
    it('uses AI to generate tests for uncovered files', async () => {
      const callback = jest.fn() as unknown as TestCallback;
      const mockGlobSync = globSync as unknown as jest.Mock;
      mockGlobSync
        .mockReturnValueOnce(['src/utils/helper.ts']) // Source files
        .mockReturnValueOnce([]); // No test files
      (readFileSync as jest.Mock).mockReturnValue('function helper() { return true; }');

      await test({aiGenerate: true}, [], callback);

      expect(aiFunction).toHaveBeenCalledWith(expect.objectContaining({
        file: 'src/utils/helper.ts',
        task: 'test'
      }));
    });

    it('skips test generation when all files have tests', async () => {
      const callback = jest.fn() as unknown as TestCallback;
      const mockGlobSync = globSync as unknown as jest.Mock;
      mockGlobSync
        .mockReturnValueOnce(['src/utils/helper.ts']) // Source files
        .mockReturnValueOnce(['src/utils/helper.test.ts']); // Test files exist

      await test({aiGenerate: true}, [], callback);

      expect(aiFunction).not.toHaveBeenCalled();
    });
  });

  describe('AI test analysis', () => {
    it('analyzes test results with AI when tests pass', async () => {
      const callback = jest.fn() as unknown as TestCallback;
      (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
      (readFileSync as jest.Mock).mockReturnValue('{"numPassedTests":5,"numFailedTests":0}');

      await test({aiAnalyze: true}, [], callback);

      expect(aiFunction).toHaveBeenCalledWith(expect.objectContaining({
        task: 'optimize'
      }));
    });
  });

  describe('AI test debugging', () => {
    it('provides AI debugging when tests fail', async () => {
      const callback = jest.fn() as unknown as TestCallback;
      (execa as jest.MockedFunction<typeof execa>).mockRejectedValue(new Error('Test failed'));
      (readFileSync as jest.Mock).mockReturnValue('{"numPassedTests":3,"numFailedTests":2,"testResults":[]}');

      await test({aiDebug: true}, [], callback);

      expect(aiFunction).toHaveBeenCalledWith(expect.objectContaining({
        task: 'help'
      }));
    });
  });

  describe('test options', () => {
    it('passes options to Jest', async () => {
      const callback = jest.fn() as unknown as TestCallback;
      (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);

      await test({
        bail: true,
        ci: true,
        runInBand: true,
        update: true
      }, [], callback);

      expect(execa).toHaveBeenCalled();
    });
  });
});