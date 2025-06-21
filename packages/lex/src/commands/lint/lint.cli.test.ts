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

describe('lint.cli tests', () => {
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
      if(filePath.includes('eslint.config.js')) {
        return false;
      }
      if(filePath.includes('package.json')) {
        return true;
      }
      return false;
    });

    (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
      if(filePath.includes('package.json')) {
        return JSON.stringify({name: 'test-app'});
      }
      if(filePath.includes('eslint.config.js')) {
        return 'export default [];';
      }
      return 'mock file content';
    });

    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (fs.unlinkSync as jest.Mock).mockImplementation(() => {});

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

  it('should run basic linting with default options', async () => {
    const options: LintOptions = {
      quiet: false
    };

    const result = await lint(options, mockCallback as unknown as typeof process.exit);

    expect(log.log).toHaveBeenCalledWith('Lex linting...', 'info', false);
    expect(log.log).toHaveBeenCalledWith('TypeScript detected from tsconfig.json', 'info', false);
    expect(fs.existsSync).toHaveBeenCalled();
    expect(execa).toHaveBeenCalled();
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Linting completed!');
    expect(result).toBe(0);
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should handle linting errors', async () => {
    const options: LintOptions = {
      cliName: 'TestLinter',
      quiet: false
    };

    (execa as unknown as jest.Mock).mockResolvedValueOnce({
      exitCode: 1,
      stdout: 'Linting failed',
      stderr: 'Error: ESLint found errors'
    });

    const result = await lint(options, mockCallback as unknown as typeof process.exit);

    expect(log.log).toHaveBeenCalledWith('TestLinter linting...', 'info', false);
    expect(mockSpinner.fail).toHaveBeenCalledWith('Linting failed!');
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  it('should handle execution errors', async () => {
    const options: LintOptions = {
      quiet: false
    };

    const errorMessage = 'Command failed';
    (execa as unknown as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    const result = await lint(options, mockCallback as unknown as typeof process.exit);

    expect(mockSpinner.fail).toHaveBeenCalledWith('Linting failed!');
    expect(log.log).toHaveBeenCalledWith(`\nLex Error: ${errorMessage}`, 'error', false);
    expect(result).toBe(1);
    expect(mockCallback).toHaveBeenCalledWith(1);
  });

  it('should detect TypeScript from tsconfig.json', async () => {
    const options: LintOptions = {
      quiet: false
    };

    await lint(options, mockCallback as unknown as typeof process.exit);

    expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('tsconfig.json'));
    expect(log.log).toHaveBeenCalledWith('TypeScript detected from tsconfig.json', 'info', false);
  });

  it('should not detect TypeScript when tsconfig.json is missing', async () => {
    const options: LintOptions = {
      quiet: false
    };

    // Mock tsconfig.json to not exist
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      if(filePath.includes('tsconfig.json')) {
        return false;
      }
      if(filePath.includes('package.json')) {
        return true;
      }
      return false;
    });

    await lint(options, mockCallback as unknown as typeof process.exit);

    expect(log.log).toHaveBeenCalledWith('TypeScript not detected from tsconfig.json', 'info', false);
  });

  it('should ensure package.json has type:module', async () => {
    const options: LintOptions = {
      quiet: false
    };

    await lint(options, mockCallback as unknown as typeof process.exit);

    expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('package.json'), 'utf8');
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('package.json'),
      expect.stringContaining('"type":"module"'),
      'utf8'
    );
  });

  it('should create temporary ESLint config when none exists', async () => {
    const options: LintOptions = {
      quiet: false
    };

    await lint(options, mockCallback as unknown as typeof process.exit);

    // Should check for config existence
    expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('eslint.config.js'));

    // Should log that no config was found
    expect(log.log).toHaveBeenCalledWith(expect.stringContaining('No ESLint configuration found'), expect.anything(), expect.anything());

    // Should write a temporary config
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('eslint.config.js'),
      expect.any(String),
      'utf8'
    );
  });

  it('should run ESLint with fix option when specified', async () => {
    const options: LintOptions = {
      fix: true,
      quiet: false
    };

    await lint(options, mockCallback as unknown as typeof process.exit);

    // Should run ESLint with fix flag
    expect(execa).toHaveBeenCalledWith(
      'npx',
      expect.arrayContaining(['--fix']),
      expect.anything()
    );
  });

  it('should run ESLint with debug option when specified', async () => {
    const options: LintOptions = {
      debug: true,
      quiet: false
    };

    await lint(options, mockCallback as unknown as typeof process.exit);

    // Should output debug info
    expect(log.log).toHaveBeenCalledWith(expect.stringContaining('Current directory'), 'info', false);

    // Should run ESLint with debug flag
    expect(execa).toHaveBeenCalledWith(
      'npx',
      expect.arrayContaining(['--debug']),
      expect.anything()
    );
  });
});