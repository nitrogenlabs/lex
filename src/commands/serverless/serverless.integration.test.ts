/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {existsSync, writeFileSync, unlinkSync} from 'fs';
import {resolve as pathResolve} from 'path';

import {serverless} from './serverless.js';

jest.mock('../../utils/app.js');
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js');

describe('Serverless Integration Tests', () => {
  const mockCreateSpinner = jest.fn(() => ({
    start: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn()
  }));
  const mockRemoveFiles = jest.fn();
  const mockLog = jest.fn();

  beforeAll(() => {
    jest.doMock('../../utils/app.js', () => ({
      createSpinner: mockCreateSpinner,
      removeFiles: mockRemoveFiles
    }));
    jest.doMock('../../utils/log.js', () => ({
      log: mockLog
    }));
    jest.doMock('../../LexConfig.js', () => ({
      LexConfig: {
        parseConfig: jest.fn(),
        config: {
          outputFullPath: './dist'
        }
      }
    }));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Environment Variable Loading', () => {
    const testDir = pathResolve(process.cwd(), 'test-temp');
    let originalCwd: string;

    beforeAll(() => {
      originalCwd = process.cwd();
    });

    beforeEach(() => {
      // Create test directory
      if(!existsSync(testDir)) {
        require('fs').mkdirSync(testDir, {recursive: true});
      }
      process.chdir(testDir);
    });

    afterEach(() => {
      // Clean up .env files
      const envFiles = ['.env', '.env.local', '.env.development'];
      envFiles.forEach(file => {
        const filePath = pathResolve(testDir, file);
        if(existsSync(filePath)) {
          unlinkSync(filePath);
        }
      });
    });

    afterAll(() => {
      process.chdir(originalCwd);
      // Clean up test directory
      if(existsSync(testDir)) {
        require('fs').rmSync(testDir, {recursive: true, force: true});
      }
    });

    it('should load environment variables from .env file', async () => {
      // Create .env file
      const envContent = `
NODE_ENV=test
API_KEY=test-api-key
DATABASE_URL=postgres://localhost:5432/test
# This is a comment
EMPTY_VAR=
QUOTED_VAR="quoted value"
      `;
      writeFileSync(pathResolve(testDir, '.env'), envContent);

      // Call serverless command in test mode
      const result = await serverless({
        quiet: true,
        test: true
      });

      // Verify environment variables were loaded
      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.API_KEY).toBe('test-api-key');
      expect(process.env.DATABASE_URL).toBe('postgres://localhost:5432/test');
      expect(process.env.QUOTED_VAR).toBe('quoted value');
      expect(process.env.EMPTY_VAR).toBe('');

      expect(result).toBe(0);
    });
  });

  it('should load environment variables from multiple .env files with proper precedence', async () => {
    // Create .env file
    writeFileSync(pathResolve(testDir, '.env'), `
NODE_ENV=production
API_KEY=base-key
BASE_VAR=base-value
      `);

    // Create .env.local file (should override .env)
    writeFileSync(pathResolve(testDir, '.env.local'), `
NODE_ENV=staging
LOCAL_VAR=local-value
      `);

    // Create .env.development file (should override both)
    writeFileSync(pathResolve(testDir, '.env.development'), `
NODE_ENV=development
DEV_VAR=dev-value
      `);

    // Call serverless command in test mode
    const result = await serverless({
      quiet: true,
      test: true
    });

    // Verify environment variables with proper precedence
    expect(process.env.NODE_ENV).toBe('development'); // From .env.development
    expect(process.env.API_KEY).toBe('base-key'); // From .env
    expect(process.env.BASE_VAR).toBe('base-value'); // From .env
    expect(process.env.LOCAL_VAR).toBe('local-value'); // From .env.local
    expect(process.env.DEV_VAR).toBe('dev-value'); // From .env.development

    expect(result).toBe(0);
  });
});

it('should allow command line variables to override .env file variables', async () => {
  // Create .env file
  writeFileSync(pathResolve(testDir, '.env'), `
NODE_ENV=production
API_KEY=env-key
      `);

  // Call serverless command with command line variables in test mode
  const result = await serverless({
    quiet: true,
    test: true,
    variables: '{"NODE_ENV":"development","CLI_VAR":"cli-value"}'
  });

  // Verify command line variables override .env variables
  expect(process.env.NODE_ENV).toBe('development'); // From command line
  expect(process.env.API_KEY).toBe('env-key'); // From .env
  expect(process.env.CLI_VAR).toBe('cli-value'); // From command line

  expect(result).toBe(0);
});
    });

it('should handle missing .env files gracefully', async () => {

  // Call serverless command without any .env files in test mode
  const result = await serverless({
    quiet: true,
    test: true
  });

  // Verify default NODE_ENV is set
  expect(process.env.NODE_ENV).toBe('development');

  expect(result).toBe(0);
});
  });
});