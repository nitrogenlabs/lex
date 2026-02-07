import {execa} from 'execa';
import {readFileSync} from 'fs';
import {sync as globSync} from 'glob';
import {existsSync} from 'node:fs';

import {test, TestCallback} from './test.js';
import {aiFunction} from '../ai/ai.js';

vi.mock('execa');
vi.mock('fs');
vi.mock('glob', async () => ({sync: vi.fn(() => [])}));
vi.mock('node:fs');
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  createSpinner: vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn()
  }))
}));
vi.mock('../../utils/log.js');
vi.mock('../ai/ai.js', async () => ({
  aiFunction: vi.fn()
}));
vi.mock('../../LexConfig.js', async () => ({
  LexConfig: {
    checkTestTypescriptConfig: vi.fn(),
    checkTypescriptConfig: vi.fn(),
    config: {
      useTypescript: true
    },
    getLexDir: vi.fn(() => '/mock/lex/dir'),
    parseConfig: vi.fn().mockResolvedValue(undefined)
  },
  getLexDir: vi.fn(() => '/mock/lex/dir'),
  getTypeScriptConfigPath: vi.fn(() => 'tsconfig.test.json')
}));
vi.mock('../../utils/file.js', async () => ({
  getDirName: vi.fn(() => '/mock/dir'),
  relativeNodePath: vi.fn(() => '/node_modules/vitest/vitest.mjs'),
  resolveBinaryPath: vi.fn(() => '/mock/path/to/vitest')
}));
vi.mock('fs', async () => ({
  existsSync: vi.fn(() => true),
  readFileSync: vi.fn(() => '{"type": "module"}')
}));

describe('test command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (readFileSync as Mock).mockReturnValue('{}');
    (existsSync as Mock).mockReturnValue(true);
    (globSync as unknown as Mock).mockReturnValue([]);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('runs Vitest with default options', async () => {
    const callback = vi.fn() as unknown as TestCallback;
    (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);

    await test({}, [], callback);

    expect(execa).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(0);
  });

  it('propagates Vitest errors', async () => {
    const callback = vi.fn() as unknown as TestCallback;
    (execa as MockedFunction<typeof execa>).mockRejectedValue(new Error('Test failed'));

    await test({}, [], callback);

    expect(callback).toHaveBeenCalledWith(1);
  });

  describe('AI test generation', () => {
    it('uses AI to generate tests for uncovered files', async () => {
      const callback = vi.fn() as unknown as TestCallback;
      const mockGlobSync = globSync as unknown as Mock;
      mockGlobSync
        .mockReturnValueOnce(['src/utils/helper.ts']) // Source files
        .mockReturnValueOnce([]); // No test files
      (readFileSync as Mock).mockReturnValue('function helper() { return true; }');

      await test({aiGenerate: true}, [], callback);

      expect(aiFunction).toHaveBeenCalledWith(expect.objectContaining({
        file: 'src/utils/helper.ts',
        task: 'test'
      }));
    });

    it('skips test generation when all files have tests', async () => {
      const callback = vi.fn() as unknown as TestCallback;
      const mockGlobSync = globSync as unknown as Mock;
      mockGlobSync
        .mockReturnValueOnce(['src/utils/helper.ts']) // Source files
        .mockReturnValueOnce(['src/utils/helper.test.ts']); // Test files exist

      await test({aiGenerate: true}, [], callback);

      expect(aiFunction).not.toHaveBeenCalled();
    });
  });

  describe('AI test analysis', () => {
    it('analyzes test results with AI when tests pass', async () => {
      const callback = vi.fn() as unknown as TestCallback;
      (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);
      (readFileSync as Mock).mockReturnValue('{"numPassedTests":5,"numFailedTests":0}');

      await test({aiAnalyze: true}, [], callback);

      expect(aiFunction).toHaveBeenCalledWith(expect.objectContaining({
        task: 'optimize'
      }));
    });
  });

  describe('AI test debugging', () => {
    it('provides AI debugging when tests fail', async () => {
      const callback = vi.fn() as unknown as TestCallback;
      (execa as MockedFunction<typeof execa>).mockRejectedValue(new Error('Test failed'));
      (readFileSync as Mock).mockReturnValue('{"numPassedTests":3,"numFailedTests":2,"testResults":[]}');

      await test({aiDebug: true}, [], callback);

      expect(aiFunction).toHaveBeenCalledWith(expect.objectContaining({
        task: 'help'
      }));
    });
  });

  describe('test options', () => {
    it('passes options to Vitest', async () => {
      const callback = vi.fn() as unknown as TestCallback;
      (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);

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
