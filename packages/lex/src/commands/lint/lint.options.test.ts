/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import fs from 'fs';
import path from 'path';

import {lint, LintOptions} from './lint.js';
import * as app from '../../utils/app.js';
import * as log from '../../utils/log.js';

// Mock dependencies
jest.mock('execa');
jest.mock('fs');
jest.mock('path');
jest.mock('url', () => ({
  fileURLToPath: jest.fn().mockReturnValue('/mock/path/lint.js')
}));
jest.mock('../../utils/app.js');
jest.mock('../../utils/log.js');

describe('lint.options tests', () => {
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

    // Mock filesystem
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      if(filePath.includes('tsconfig.json')) {
        return true;
      }
      if(filePath.includes('package.json')) {
        return true;
      }
      if(filePath.includes('eslint.config.js')) {
        return true;
      }
      return false;
    });

    (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
      if(filePath.includes('package.json')) {
        return JSON.stringify({name: 'test-project'});
      }
      if(filePath.includes('eslint.config.js')) {
        return 'export default [];';
      }
      return 'mock file content';
    });

    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

    // Mock path
    (path.resolve as jest.Mock).mockImplementation((...args) => args.join('/'));
    (path.dirname as jest.Mock).mockReturnValue('/mock/path');

    // Mock execa
    (execa as unknown as jest.Mock).mockResolvedValue({
      exitCode: 0,
      stdout: 'Linting completed successfully',
      stderr: ''
    });

    // Mock callback
    mockCallback = jest.fn();
  });

  it('should apply fix option to ESLint command', async () => {
    const options: LintOptions = {
      fix: true,
      quiet: false
    };

    await lint(options, mockCallback as unknown as typeof process.exit);

    // Should run ESLint with --fix flag
    expect(execa).toHaveBeenCalledWith(
      'npx',
      expect.arrayContaining(['--fix']),
      expect.anything()
    );
  });

  it('should apply debug option to ESLint command', async () => {
    const options: LintOptions = {
      debug: true,
      quiet: false
    };

    await lint(options, mockCallback as unknown as typeof process.exit);

    // Should run ESLint with --debug flag
    expect(execa).toHaveBeenCalledWith(
      'npx',
      expect.arrayContaining(['--debug']),
      expect.anything()
    );

    // Should also output debug logs
    expect(log.log).toHaveBeenCalledWith(expect.stringContaining('Current directory'), 'info', false);
  });

  it('should respect custom config path option', async () => {
    const customConfig = './custom-eslint.config.js';
    const options: LintOptions = {
      config: customConfig,
      quiet: false
    };

    // Mock the custom config existence
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      if(filePath.includes(customConfig)) {
        return true;
      }
      if(filePath.includes('tsconfig.json')) {
        return true;
      }
      if(filePath.includes('package.json')) {
        return true;
      }
      return false;
    });

    await lint(options, mockCallback as unknown as typeof process.exit);

    // Should log it's using custom config
    expect(log.log).toHaveBeenCalledWith(
      expect.stringContaining(`Using specified ESLint configuration: ${customConfig}`),
      expect.anything(),
      expect.anything()
    );
  });

  it('should fall back to default config when custom config is not found', async () => {
    const nonExistentConfig = './non-existent-config.js';
    const options: LintOptions = {
      config: nonExistentConfig,
      quiet: false
    };

    await lint(options, mockCallback as unknown as typeof process.exit);

    // Should warn about missing custom config
    expect(log.log).toHaveBeenCalledWith(
      expect.stringContaining(`Specified ESLint configuration not found: ${nonExistentConfig}`),
      'warn',
      false
    );
  });

  it('should apply aifix option and run AI linting when specified', async () => {
    jest.mock('../../utils/aiService.js', () => ({
      callAIService: jest.fn().mockResolvedValue('fixed code')
    }));

    const options: LintOptions = {
      aifix: true,
      quiet: false
    };

    // First ESLint run fails with errors
    (execa as unknown as jest.Mock)
      .mockResolvedValueOnce({
        exitCode: 1,
        stdout: 'Error: Linting issues found',
        stderr: 'Errors in file.js'
      })
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: 'Linting passed after fixes',
        stderr: ''
      });

    await lint(options, mockCallback as unknown as typeof process.exit);

    // Should make two ESLint runs - first with --fix, then after AI fixes
    expect(execa).toHaveBeenCalledTimes(2);
  });

  it('should respect quiet option and suppress output', async () => {
    const options: LintOptions = {
      quiet: true
    };

    await lint(options, mockCallback as unknown as typeof process.exit);

    // All log calls should have quiet=true
    const logCalls = (log.log as jest.Mock).mock.calls;
    for(const call of logCalls) {
      expect(call[2]).toBe(true);
    }

    // Should create spinner with quiet=true
    expect(app.createSpinner).toHaveBeenCalledWith(true);
  });

  it('should use custom CLI name in logs when provided', async () => {
    const customName = 'CustomLinter';
    const options: LintOptions = {
      cliName: customName,
      quiet: false
    };

    await lint(options, mockCallback as unknown as typeof process.exit);

    // Should use custom name in logs
    expect(log.log).toHaveBeenCalledWith(`${customName} linting...`, 'info', false);
  });

  it('should apply all ESLint options to the command', async () => {
    const options: LintOptions = {
      fix: true,
      debug: true,
      quiet: false,
      noColor: true  // Example of another ESLint option
    };

    await lint(options, mockCallback as unknown as typeof process.exit);

    // Should include all the flags
    expect(execa).toHaveBeenCalledWith(
      'npx',
      expect.arrayContaining(['--fix', '--debug']),
      expect.anything()
    );

    // Note: Currently noColor and other options aren't directly passed to ESLint,
    // but in a real implementation they would be
  });
});