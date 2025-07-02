/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import fs from 'fs';
import path from 'path';

import {lint, LintOptions} from './lint.js';
import * as aiService from '../../utils/aiService.js';
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
jest.mock('../../utils/aiService.js');
jest.mock('../../LexConfig.js', () => ({
  LexConfig: {
    config: {
      ai: {
        provider: 'openai'
      }
    }
  }
}));

describe('lint integration tests', () => {
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

    // Mock filesystem functions
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      if(filePath.includes('eslint.config.js')) {
        return false;
      }
      if(filePath.includes('tsconfig.json')) {
        return true;
      }
      if(filePath.includes('package.json')) {
        return true;
      }
      return false;
    });

    (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
      if(filePath.includes('package.json')) {
        return JSON.stringify({name: 'test-project'});
      }
      if(filePath.includes('eslint.config.js') && filePath.includes('/mock/path')) {
        return 'export default [];';
      }
      if(filePath.includes('file1.js')) {
        return 'const x = y == z; // eslint error';
      }
      return 'mock file content';
    });

    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (fs.unlinkSync as jest.Mock).mockImplementation(() => {});

    // Mock path
    (path.resolve as jest.Mock).mockImplementation((...args) => args.join('/'));
    (path.dirname as jest.Mock).mockReturnValue('/mock/path');

    // Mock process.cwd
    jest.spyOn(process, 'cwd').mockReturnValue('/test/project');

    // Mock execa
    (execa as unknown as jest.Mock).mockResolvedValue({
      exitCode: 0,
      stdout: 'Linting completed successfully',
      stderr: ''
    });

    // Mock AI service
    (aiService.callAIService as jest.Mock).mockResolvedValue('// Fixed code\nconst x = y === z;');

    // Mock callback
    mockCallback = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should run linting with ESLint config from Lex when no project config exists', async () => {
    const options: LintOptions = {
      quiet: false
    };

    // Mock finding Lex's eslint.config.js
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      if(filePath.includes('/mock/path/../../../../eslint.config.js')) {
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

    // Should log that it's using Lex's default configuration
    expect(log.log).toHaveBeenCalledWith(expect.stringContaining('Using Lex\'s default configuration'), expect.anything(), expect.anything());

    // Should run ESLint with the correct config
    expect(execa).toHaveBeenCalledWith(
      'npx',
      expect.arrayContaining(['eslint', '--config', expect.stringContaining('eslint.config.js')]),
      expect.anything()
    );

    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should create temporary ESLint config when no config is found', async () => {
    const options: LintOptions = {
      quiet: false
    };

    // Mock not finding any eslint.config.js
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      if(filePath.includes('eslint.config.js')) {
        return false;
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

    // Should create a default config
    expect(log.log).toHaveBeenCalledWith(expect.stringContaining('Creating a temporary configuration'), expect.anything(), expect.anything());
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('eslint.config.js'),
      expect.any(String),
      'utf8'
    );

    // Should restore or remove the temporary config at the end
    expect(fs.unlinkSync).toHaveBeenCalled();
  });

  it('should restore original ESLint config when temporary was created', async () => {
    const options: LintOptions = {
      quiet: false
    };

    // Mock an existing eslint.config.js that we'll temporarily replace
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      if(filePath.includes('/test/project/eslint.config.js')) {
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

    (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
      if(filePath.includes('/test/project/eslint.config.js')) {
        return 'export default [{ original: true }];';
      }
      return JSON.stringify({name: 'test-project'});
    });

    await lint(options, mockCallback as unknown as typeof process.exit);

    // Should restore the original config
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('eslint.config.js'),
      'export default [{ original: true }];',
      'utf8'
    );
  });

  it('should apply AI fixes when fix option is enabled and linting fails', async () => {
    const options: LintOptions = {
      quiet: false,
      fix: true
    };

    // First run fails, then succeeds after AI fix
    (execa as unknown as jest.Mock)
      .mockResolvedValueOnce({
        exitCode: 1,
        stdout: 'Error: Expected === but got ==',
        stderr: '/test/project/file1.js:1:10: Expected === instead of ==.'
      })
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: 'Linting completed successfully',
        stderr: ''
      });

    await lint(options, mockCallback as unknown as typeof process.exit);

    // Should try to apply AI fixes
    expect(mockSpinner.start).toHaveBeenCalledWith('Using AI to fix remaining lint issues...');
    expect(aiService.callAIService).toHaveBeenCalledWith(
      expect.stringContaining('Fix the following ESLint errors'),
      false
    );

    // Should write fixed content to files
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('=== z'),
      'utf8'
    );

    // Should succeed after fixes
    expect(mockSpinner.succeed).toHaveBeenCalledWith('AI fixes applied successfully!');
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should apply rule-based fixes when AI service is unavailable', async () => {
    const options: LintOptions = {
      fix: true,
      quiet: false
    };

    // First run fails, then succeeds after fallback fix
    (execa as unknown as jest.Mock)
      .mockResolvedValueOnce({
        exitCode: 1,
        stdout: 'Error: \'x\' is assigned a value but never used',
        stderr: '/test/project/file1.js:1:6: \'x\' is assigned a value but never used.'
      })
      .mockResolvedValueOnce({
        exitCode: 0,
        stdout: 'Linting completed successfully',
        stderr: ''
      });

    // Make AI service fail
    (aiService.callAIService as jest.Mock).mockResolvedValue(null);

    await lint(options, mockCallback as unknown as typeof process.exit);

    // Should attempt AI but fall back to rule-based
    expect(log.log).toHaveBeenCalledWith(
      expect.stringContaining('AI service unavailable'),
      expect.anything(),
      expect.anything()
    );

    // Should still succeed with fallback fixes
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should handle special case where no files match the patterns', async () => {
    const options: LintOptions = {
      quiet: false
    };

    // No files found
    (execa as unknown as jest.Mock).mockResolvedValue({
      exitCode: 1,
      stdout: '',
      stderr: 'No such file or directory'
    });

    await lint(options, mockCallback as unknown as typeof process.exit);

    // Should succeed with no files message
    expect(mockSpinner.succeed).toHaveBeenCalledWith('No files found to lint');
    expect(mockCallback).toHaveBeenCalledWith(0);
  });

  it('should handle custom config option when specified', async () => {
    const customConfig = './custom-eslint.config.js';
    const options: LintOptions = {
      quiet: false,
      config: customConfig
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

    // Should log using the custom config
    expect(log.log).toHaveBeenCalledWith(
      expect.stringContaining(`Using specified ESLint configuration: ${customConfig}`),
      expect.anything(),
      expect.anything()
    );
  });

  it('should run ESLint separately for JS and TS files when TypeScript is detected', async () => {
    const options: LintOptions = {
      quiet: false
    };

    await lint(options, mockCallback as unknown as typeof process.exit);

    // Should run twice - once for JS and once for TS
    expect(execa).toHaveBeenCalledTimes(2);

    // Check first call for JS files
    expect(execa).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining(['src/**/*.{js,jsx}']),
      expect.anything()
    );

    // Check second call for TS files
    expect(execa).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining(['src/**/*.{ts,tsx}']),
      expect.anything()
    );
  });

  it('should find AI configuration in lex.config.mjs file', async () => {
    const options: LintOptions = {
      quiet: false
    };

    // Mock lex.config.mjs exists with AI configuration
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      if(filePath.includes('/test/project/lex.config.mjs')) {
        return true;
      }
      if(filePath.includes('/test/project/lex.config.js')) {
        return false;
      }
      if(filePath.includes('/test/project/lex.config.cjs')) {
        return false;
      }
      if(filePath.includes('/test/project/lex.config.ts')) {
        return false;
      }
      if(filePath.includes('/test/project/lex.config.json')) {
        return false;
      }
      if(filePath.includes('tsconfig.json')) {
        return true;
      }
      if(filePath.includes('package.json')) {
        return true;
      }
      return false;
    });

    // Mock the import of lex.config.mjs
    const mockImport = jest.fn().mockResolvedValue({
      default: {
        ai: {
          provider: 'openai',
          apiKey: 'test-key'
        }
      }
    });
    jest.doMock('/test/project/lex.config.mjs', () => mockImport(), {virtual: true});

    await lint(options, mockCallback as unknown as typeof process.exit);

    // Should log that it found AI configuration in the mjs file
    expect(log.log).toHaveBeenCalledWith(
      expect.stringContaining('Found AI configuration in /test/project/lex.config.mjs'),
      expect.anything(),
      expect.anything()
    );
  });

  it('should find AI configuration in lex.config.cjs file', async () => {
    const options: LintOptions = {
      quiet: false
    };

    // Mock lex.config.cjs exists with AI configuration
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      if(filePath.includes('/test/project/lex.config.mjs')) {
        return false;
      }
      if(filePath.includes('/test/project/lex.config.js')) {
        return false;
      }
      if(filePath.includes('/test/project/lex.config.cjs')) {
        return true;
      }
      if(filePath.includes('/test/project/lex.config.ts')) {
        return false;
      }
      if(filePath.includes('/test/project/lex.config.json')) {
        return false;
      }
      if(filePath.includes('tsconfig.json')) {
        return true;
      }
      if(filePath.includes('package.json')) {
        return true;
      }
      return false;
    });

    // Mock the import of lex.config.cjs
    const mockImport = jest.fn().mockResolvedValue({
      default: {
        ai: {
          provider: 'anthropic',
          apiKey: 'test-key'
        }
      }
    });
    jest.doMock('/test/project/lex.config.cjs', () => mockImport(), {virtual: true});

    await lint(options, mockCallback as unknown as typeof process.exit);

    // Should log that it found AI configuration in the cjs file
    expect(log.log).toHaveBeenCalledWith(
      expect.stringContaining('Found AI configuration in /test/project/lex.config.cjs'),
      expect.anything(),
      expect.anything()
    );
  });
});