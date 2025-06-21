/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import fs from 'fs';
import path from 'path';
import {URL} from 'url';

import {getTestFilePatterns, test, TestOptions} from './test.js';
import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as file from '../../utils/file.js';
import * as log from '../../utils/log.js';
import * as ai from '../ai/ai.js';

// Mock dependencies
jest.mock('execa');
jest.mock('fs');
jest.mock('path');
jest.mock('url');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/file.js');
jest.mock('../../utils/log.js');
jest.mock('../ai/ai.js');

// Mock glob module
jest.mock('glob', () => ({
  sync: jest.fn((pattern) => {
    if(pattern.includes('**/*.test.*') || pattern.includes('**/*.spec.*')) {
      return ['src/file1.test.ts', 'src/file2.spec.ts'];
    }
    if(pattern.includes('src/**/*.{ts,tsx,js,jsx}')) {
      return ['src/file1.ts', 'src/file2.tsx', 'src/file3.js', 'src/untested.ts'];
    }
    return [];
  })
}));

describe('test.cli tests', () => {
  let mockSpinner: any;
  let mockCallback: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock spinner
    mockSpinner = {
      start: jest.fn(),
      succeed: jest.fn(),
      fail: jest.fn()
    };
    (app.createSpinner as jest.Mock).mockReturnValue(mockSpinner);

    // Mock LexConfig
    (LexConfig.parseConfig as jest.Mock).mockResolvedValue({});
    (LexConfig.config as any) = {
      useTypescript: true
    };
    (LexConfig.checkTypescriptConfig as jest.Mock).mockImplementation(() => {});

    // Mock file system
    (fs.readFileSync as jest.Mock).mockImplementation((file) => {
      if(file.includes('.json')) {
        return '{"numFailedTests":0,"numPassedTests":5}';
      }
      return 'test file content';
    });

    // Mock URL
    (URL as jest.MockedClass<typeof URL>).mockImplementation(() => ({
      pathname: '/mock/path'
    } as unknown as URL));

    // Mock path
    (path.resolve as jest.Mock).mockImplementation((...args) => args.join('/'));

    // Mock file utils
    (file.relativeNodePath as jest.Mock).mockReturnValue('/node_modules/jest-cli/bin/jest.js');

    // Mock execa
    (execa as unknown as jest.Mock).mockResolvedValue({
      stdout: 'test results',
      stderr: ''
    });

    // Mock AI
    (ai.ai as jest.Mock).mockResolvedValue({});

    // Mock callback
    mockCallback = jest.fn();
  });

  describe('getTestFilePatterns', () => {
    it('should return default patterns if no testPathPattern is provided', () => {
      const patterns = getTestFilePatterns();
      expect(patterns).toEqual(['**/*.test.*', '**/*.spec.*']);
    });

    it('should return provided testPathPattern if available', () => {
      const pattern = 'src/components/**/*.test.tsx';
      const patterns = getTestFilePatterns(pattern);
      expect(patterns).toEqual([pattern]);
    });
  });

  describe('test function', () => {
    it('should run Jest with default options', async () => {
      const options: TestOptions = {
        quiet: false
      };

      const result = await test(options, [], mockCallback as unknown as typeof process.exit);

      expect(log.log).toHaveBeenCalledWith('Lex testing...', 'info', false);
      expect(app.createSpinner).toHaveBeenCalledWith(false);
      expect(LexConfig.parseConfig).toHaveBeenCalledWith(options);
      expect(LexConfig.checkTypescriptConfig).toHaveBeenCalled();

      expect(execa).toHaveBeenCalledWith(
        '/node_modules/jest-cli/bin/jest.js',
        expect.arrayContaining(['--no-cache', '--config']),
        expect.objectContaining({encoding: 'utf8'})
      );

      expect(mockSpinner.succeed).toHaveBeenCalledWith('Testing completed!');
      expect(result).toBe(0);
      expect(mockCallback).toHaveBeenCalledWith(0);
    });

    it('should handle execa errors', async () => {
      const options: TestOptions = {
        quiet: false
      };

      (execa as unknown as jest.Mock).mockRejectedValueOnce({
        message: 'Jest error'
      });

      const result = await test(options, [], mockCallback as unknown as typeof process.exit);

      expect(log.log).toHaveBeenCalledWith('\nLex Error: Check for unit test errors and/or coverage.', 'error', false);
      expect(mockSpinner.fail).toHaveBeenCalledWith('Testing failed!');
      expect(result).toBe(1);
      expect(mockCallback).toHaveBeenCalledWith(1);
    });

    it('should generate tests with AI when generate option is true', async () => {
      const options: TestOptions = {
        quiet: false,
        generate: true
      };

      await test(options, [], mockCallback as unknown as typeof process.exit);

      expect(mockSpinner.start).toHaveBeenCalledWith('AI is analyzing code to generate test cases...');
      expect(ai.ai).toHaveBeenCalledWith(expect.objectContaining({
        prompt: expect.stringContaining('Generate Jest unit tests'),
        task: 'test'
      }));
      expect(mockSpinner.succeed).toHaveBeenCalledWith(expect.stringContaining('AI test generation'));
    });

    it('should analyze tests with AI when analyze option is true', async () => {
      const options: TestOptions = {
        quiet: false,
        analyze: true
      };

      await test(options, [], mockCallback as unknown as typeof process.exit);

      expect(mockSpinner.start).toHaveBeenCalledWith('AI is analyzing test coverage and suggesting improvements...');
      expect(ai.ai).toHaveBeenCalledWith(expect.objectContaining({
        prompt: expect.stringContaining('Analyze these Jest test results'),
        task: 'optimize'
      }));
      expect(mockSpinner.succeed).toHaveBeenCalledWith('AI test analysis complete');
    });

    it('should provide debugging assistance with AI when debug option is true and tests fail', async () => {
      const options: TestOptions = {
        quiet: false,
        debugTests: true
      };

      (execa as unknown as jest.Mock).mockRejectedValueOnce({
        message: 'Jest error with failing tests'
      });

      await test(options, [], mockCallback as unknown as typeof process.exit);

      expect(mockSpinner.start).toHaveBeenCalledWith('AI is analyzing test failures...');
      expect(ai.ai).toHaveBeenCalledWith(expect.objectContaining({
        prompt: expect.stringContaining('Debug these failed Jest tests'),
        task: 'help'
      }));
      expect(mockSpinner.succeed).toHaveBeenCalledWith('AI debugging assistance complete');
    });

    it('should handle errors during AI test generation', async () => {
      const options: TestOptions = {
        quiet: false,
        generate: true
      };

      (ai.ai as jest.Mock).mockRejectedValueOnce(new Error('AI error'));

      await test(options, [], mockCallback as unknown as typeof process.exit);

      expect(mockSpinner.fail).toHaveBeenCalledWith('Could not generate AI test suggestions');
    });
  });
});