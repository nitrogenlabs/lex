/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import fs from 'fs';
import path from 'path';
import {URL} from 'url';

import {test, TestOptions} from './test.js';
import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as file from '../../utils/file.js';
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
  sync: jest.fn((_pattern, _options) => {
    // For test files search
    if(_pattern.includes('**/*.{test,spec}')) {
      return [
        'src/components/Button.test.tsx',
        'src/utils/format.spec.js'
      ];
    }

    // For source files
    if(_pattern.includes('src/**/*.{ts,tsx,js,jsx}')) {
      return [
        'src/components/Button.tsx',
        'src/components/Card.tsx', // Has no test
        'src/utils/format.js'
      ];
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
      if(typeof file === 'string' && file.includes('.json')) {
        return JSON.stringify({
          numTotalTests: 10,
          numPassedTests: 8,
          numFailedTests: 2,
          testResults: [
            {
              name: 'src/components/Button.test.tsx',
              status: 'passed',
              assertionResults: [
                {status: 'passed', title: 'renders correctly'},
                {status: 'passed', title: 'handles click events'}
              ]
            },
            {
              name: 'src/utils/format.spec.js',
              status: 'failed',
              assertionResults: [
                {status: 'passed', title: 'formats dates correctly'},
                {status: 'failed', title: 'handles null values', failureMessages: ['Expected null but received undefined']}
              ]
            }
          ]
        });
      }
      return 'export const Component = () => <div>Test</div>;';
    });

    // Mock URL
    (URL as jest.MockedClass<typeof URL>).mockImplementation(() => ({
      pathname: '/mock/path'
    } as unknown as URL));

    // Mock path
    (path.resolve as jest.Mock).mockImplementation((...args) => args.join('/'));

    // Mock file utils
    (file.relativeNodePath as jest.Mock).mockImplementation((module) => `/node_modules/${module}`);

    // Mock execa
    (execa as unknown as jest.Mock).mockResolvedValue({
      stdout: 'test results',
      stderr: ''
    });

    // Mock AI
    (ai.ai as jest.Mock).mockResolvedValue({});

    // Mock callback
    mockCallback = jest.fn();

    // Setup temp file path
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

    // Verify it passes the right options
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

    // Verify AI was called properly
    expect(ai.ai).toHaveBeenCalledWith(expect.objectContaining({
      prompt: expect.stringContaining('Generate Jest unit tests for this file'),
      task: 'test'
    }));

    // Should show success message
    expect(mockSpinner.succeed).toHaveBeenCalledWith(expect.stringContaining('AI test generation suggestions provided'));
  });

  it('should handle AI test analysis with proper test results', async () => {
    const options: TestOptions = {
      quiet: false,
      analyze: true
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    // Should create output file for analysis
    const jestArgs = (execa as unknown as jest.Mock).mock.calls[0][1];
    expect(jestArgs).toContain('--json');
    expect(jestArgs).toContain('--outputFile');
    expect(jestArgs).toContain(tempOutputFile);

    // Should call AI with test results
    expect(ai.ai).toHaveBeenCalledWith(expect.objectContaining({
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

    // Mock test failure
    (execa as unknown as jest.Mock).mockRejectedValueOnce({
      message: 'Tests failed'
    });

    await test(options, [], mockCallback as unknown as typeof process.exit);

    // Should have set up the output file
    const jestArgs = (execa as unknown as jest.Mock).mock.calls[0][1];
    expect(jestArgs).toContain('--json');
    expect(jestArgs).toContain('--outputFile');

    // Should call AI with error analysis
    expect(ai.ai).toHaveBeenCalledWith(expect.objectContaining({
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

    // Should call AI for test generation
    expect(ai.ai).toHaveBeenCalledWith(expect.objectContaining({
      task: 'test'
    }));

    // Should also set up analysis after testing
    expect(ai.ai).toHaveBeenCalledWith(expect.objectContaining({
      task: 'optimize'
    }));

    expect(mockSpinner.succeed).toHaveBeenCalledWith(expect.stringContaining('AI test generation'));
    expect(mockSpinner.succeed).toHaveBeenCalledWith('AI test analysis complete');
  });

  it('should handle error during test run with AI debug disabled', async () => {
    const options: TestOptions = {
      quiet: false
    };

    // Mock test failure
    (execa as unknown as jest.Mock).mockRejectedValueOnce({
      message: 'Tests failed'
    });

    await test(options, [], mockCallback as unknown as typeof process.exit);

    // Should not call AI for debugging
    expect(ai.ai).not.toHaveBeenCalled();

    expect(mockSpinner.fail).toHaveBeenCalledWith('Testing failed!');
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  it('should handle errors in AI test generation', async () => {
    const options: TestOptions = {
      quiet: false,
      generate: true
    };

    // Mock AI error
    (ai.ai as jest.Mock).mockRejectedValueOnce(new Error('AI service unavailable'));

    await test(options, [], mockCallback as unknown as typeof process.exit);

    expect(mockSpinner.fail).toHaveBeenCalledWith('Could not generate AI test suggestions');

    // Should still run tests even if AI fails
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

    // Verify the additional args were passed to jest
    const execaCalls = (execa as unknown as jest.Mock).mock.calls;
    const jestCall = execaCalls[0];
    const jestArgs = jestCall[1];

    expect(jestArgs).toContain('--findRelatedTests');
    expect(jestArgs).toContain('src/components/Button.tsx');
  });
});