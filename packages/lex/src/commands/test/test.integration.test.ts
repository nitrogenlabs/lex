/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import * as fs from 'fs';
import * as path from 'path';
import {URL} from 'url';

import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as file from '../../utils/file.js';
import * as log from '../../utils/log.js';
import * as aiModule from '../ai/ai.js';
import {getTestFilePatterns, test, TestOptions} from './test.js';

jest.mock('execa');
jest.mock('fs');
jest.mock('path');
jest.mock('url');
jest.mock('../../LexConfig.js');
jest.mock('../../utils/app.js');
jest.mock('../../utils/file.js');
jest.mock('../../utils/log.js');
jest.mock('../ai/ai.js', () => ({
  aiFunction: jest.fn().mockResolvedValue({}),
  ai: { action: jest.fn() }
}));

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

describe('test integration tests', () => {
  let mockSpinner: any;
  let mockCallback: jest.Mock;
  let tempOutputFile: string;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSpinner = {
      start: jest.fn(),
      succeed: jest.fn(),
      fail: jest.fn()
    };
    (app.createSpinner as jest.Mock).mockReturnValue(mockSpinner);

    (LexConfig.parseConfig as jest.Mock).mockResolvedValue({});
    (LexConfig.config as any) = {
      useTypescript: true,
      outputFullPath: '/mock/output',
      sourceFullPath: '/mock/src',
      targetEnvironment: 'node'
    };
    (LexConfig.checkTypescriptConfig as jest.Mock).mockImplementation(() => {});

    (fs.readFileSync as jest.Mock).mockImplementation((file) => {
      if(file.includes('.json')) {
        return '{"numFailedTests":0,"numPassedTests":5,"testResults":[]}';
      }
      return 'test file content';
    });
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    (URL as jest.MockedClass<typeof URL>).mockImplementation(() => ({
      pathname: '/mock/path'
    } as unknown as URL));

    (path.resolve as jest.Mock).mockImplementation((...args) => args.join('/'));

    (file.relativeNodePath as jest.Mock).mockImplementation((module) => `/node_modules/${module}`);

    (execa as unknown as jest.Mock).mockResolvedValue({
      stdout: 'test results',
      stderr: ''
    });

    (aiModule.aiFunction as jest.Mock).mockResolvedValue({});

    mockCallback = jest.fn();

    tempOutputFile = '.lex-test-results.json';
  });

  it('should execute jest with the correct configuration', async () => {
    const options: TestOptions = {
      quiet: false,
      bail: true,
      ci: true,
      colors: true,
      verbose: true
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    expect(file.relativeNodePath).toHaveBeenCalledWith('jest-cli/bin/jest.js', expect.anything());

    const execaCalls = (execa as unknown as jest.Mock).mock.calls;
    const jestCall = execaCalls[0];
    const jestArgs = jestCall[1];

    expect(jestArgs).toContain('--bail');
    expect(jestArgs).toContain('--ci');
    expect(jestArgs).toContain('--colors');
    expect(jestArgs).toContain('--verbose');

    expect(mockSpinner.succeed).toHaveBeenCalledWith('Testing completed!');
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should set up AI test generation for uncovered files', async () => {
    const options: TestOptions = {
      quiet: false,
      generate: true
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    expect(aiModule.aiFunction).toHaveBeenCalledWith(expect.objectContaining({
      prompt: expect.stringContaining('Generate Jest unit tests for this file'),
      task: 'test'
    }));

    expect(mockSpinner.succeed).toHaveBeenCalledWith(expect.stringContaining('AI test generation suggestions provided'));
  });

  it('should handle AI test analysis with proper test results', async () => {
    const options: TestOptions = {
      quiet: false,
      analyze: true
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const jestArgs = (execa as unknown as jest.Mock).mock.calls[0][1];
    expect(jestArgs).toContain('--json');
    expect(jestArgs).toContain('--outputFile');
    expect(jestArgs).toContain(tempOutputFile);

    expect(aiModule.aiFunction).toHaveBeenCalledWith(expect.objectContaining({
      prompt: expect.stringContaining('Analyze these Jest test results'),
      task: 'optimize'
    }));

    expect(mockSpinner.succeed).toHaveBeenCalledWith('AI test analysis complete');
  });

  it('should generate AI debugging assistance when tests fail', async () => {
    const options: TestOptions = {
      quiet: false,
      debugTests: true
    };

    (execa as unknown as jest.Mock).mockRejectedValueOnce({
      message: 'Tests failed'
    });

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const jestArgs = (execa as unknown as jest.Mock).mock.calls[0][1];
    expect(jestArgs).toContain('--json');
    expect(jestArgs).toContain('--outputFile');

    expect(aiModule.aiFunction).toHaveBeenCalledWith(expect.objectContaining({
      prompt: expect.stringContaining('Debug these failed Jest tests'),
      task: 'help'
    }));

    expect(mockSpinner.succeed).toHaveBeenCalledWith('AI debugging assistance complete');
  });

  it('should handle all combinations of AI options', async () => {
    const options: TestOptions = {
      quiet: false,
      generate: true,
      analyze: true,
      debugTests: true
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    expect(aiModule.aiFunction).toHaveBeenCalledWith(expect.objectContaining({
      task: 'test'
    }));

    expect(aiModule.aiFunction).toHaveBeenCalledWith(expect.objectContaining({
      task: 'optimize'
    }));

    expect(mockSpinner.succeed).toHaveBeenCalledWith(expect.stringContaining('AI test generation'));
    expect(mockSpinner.succeed).toHaveBeenCalledWith('AI test analysis complete');
  });

  it('should handle error during test run with AI debug disabled', async () => {
    const options: TestOptions = {
      quiet: false
    };

    (execa as unknown as jest.Mock).mockRejectedValueOnce({
      message: 'Tests failed'
    });

    await test(options, [], mockCallback as unknown as typeof process.exit);

    expect(aiModule.aiFunction).not.toHaveBeenCalled();

    expect(mockSpinner.fail).toHaveBeenCalledWith('Testing failed!');
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  it('should handle errors in AI test generation', async () => {
    const options: TestOptions = {
      quiet: false,
      generate: true
    };

    (aiModule.aiFunction as jest.Mock).mockRejectedValueOnce(new Error('AI service unavailable'));

    await test(options, [], mockCallback as unknown as typeof process.exit);

    expect(mockSpinner.fail).toHaveBeenCalledWith('Could not generate AI test suggestions');

    expect(execa).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything()
    );
  });

  it('should handle custom additional arguments', async () => {
    const options: TestOptions = {
      quiet: false
    };
    const additionalArgs = ['--findRelatedTests', 'src/components/Button.tsx'];

    await test(options, additionalArgs, mockCallback as unknown as typeof process.exit);

    const execaCalls = (execa as unknown as jest.Mock).mock.calls;
    const jestCall = execaCalls[0];
    const jestArgs = jestCall[1];

    expect(jestArgs).toContain('--findRelatedTests');
    expect(jestArgs).toContain('src/components/Button.tsx');
  });
});