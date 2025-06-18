/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import {readFileSync, writeFileSync} from 'fs';
import {sync as globSync} from 'glob';
import {existsSync} from 'node:fs';

import {test, TestCallback} from './test.js';
import {ai} from '../ai/index.js';

// Mock dependencies
jest.mock('execa');
jest.mock('../../utils/app.js', () => ({
  createSpinner: jest.fn(() => ({
    start: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn()
  }))
}));
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js', () => ({
  LexConfig: {
    parseConfig: jest.fn(),
    checkTypescriptConfig: jest.fn(),
    config: {
      useTypescript: true
    }
  }
}));
jest.mock('glob');
jest.mock('fs');
jest.mock('../ai/index.js');

describe('test command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (readFileSync as jest.Mock).mockReturnValue('{}');
    (existsSync as jest.Mock).mockReturnValue(true);
    (globSync as unknown as jest.Mock).mockReturnValue([]);
  });

  describe('basic test functionality', () => {
    it('runs Jest with default options', async () => {
      const callback = jest.fn() as unknown as TestCallback;
      (execa as jest.Mock).mockResolvedValueOnce({});

      await test({}, [], callback);

      expect(execa).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(0);
    });

    it('propagates Jest errors', async () => {
      const callback = jest.fn() as unknown as TestCallback;
      const error = new Error('Jest error');
      (execa as jest.Mock).mockRejectedValueOnce(error);

      await test({}, [], callback);

      expect(callback).toHaveBeenCalledWith(1);
    });
  });

  describe('AI test generation', () => {
    it('uses AI to generate tests for uncovered files', async () => {
      const callback = jest.fn() as unknown as TestCallback;
      (execa as jest.Mock).mockResolvedValueOnce({});
      const mockGlobSync = globSync as unknown as jest.Mock;
      mockGlobSync
        .mockReturnValueOnce(['src/utils/helper.ts']) // Source files
        .mockReturnValueOnce([]); // No test files
      (readFileSync as jest.Mock).mockReturnValue('function helper() { return true; }');

      await test({aiGenerate: true}, [], callback);

      expect(ai).toHaveBeenCalledWith(expect.objectContaining({
        task: 'test',
        file: 'src/utils/helper.ts'
      }));
    });

    it('skips test generation when all files have tests', async () => {
      const callback = jest.fn() as unknown as TestCallback;
      (execa as jest.Mock).mockResolvedValueOnce({});
      const mockGlobSync = globSync as unknown as jest.Mock;
      mockGlobSync
        .mockReturnValueOnce(['src/utils/helper.ts']) // Source files
        .mockReturnValueOnce(['src/utils/helper.test.ts']); // Test files exist

      await test({aiGenerate: true}, [], callback);

      expect(ai).not.toHaveBeenCalled();
    });
  });

  describe('AI test analysis', () => {
    it('analyzes test results with AI when tests pass', async () => {
      const callback = jest.fn() as unknown as TestCallback;
      (execa as jest.Mock).mockResolvedValueOnce({});
      (readFileSync as jest.Mock).mockReturnValue('{"numPassedTests":5,"numFailedTests":0}');

      await test({aiAnalyze: true}, [], callback);

      expect(ai).toHaveBeenCalledWith(expect.objectContaining({
        task: 'optimize'
      }));
    });
  });

  describe('AI test debugging', () => {
    it('provides AI debugging when tests fail', async () => {
      const callback = jest.fn() as unknown as TestCallback;
      const error = new Error('Jest test failures');
      (execa as jest.Mock).mockRejectedValueOnce(error);
      (readFileSync as jest.Mock).mockReturnValue('{"numPassedTests":3,"numFailedTests":2,"testResults":[]}');

      await test({aiDebug: true}, [], callback);

      expect(ai).toHaveBeenCalledWith(expect.objectContaining({
        task: 'help'
      }));
    });
  });

  describe('test options', () => {
    it('passes options to Jest', async () => {
      const callback = jest.fn() as unknown as TestCallback;
      (execa as jest.Mock).mockResolvedValueOnce({});

      await test({
        bail: true,
        ci: true,
        runInBand: true,
        update: true
      }, [], callback);

      const execaCall = (execa as jest.Mock).mock.calls[0];
      const options = execaCall[1];

      expect(options).toContain('--bail');
      expect(options).toContain('--ci');
      expect(options).toContain('--runInBand');
      expect(options).toContain('--updateSnapshot');
    });
  });
});