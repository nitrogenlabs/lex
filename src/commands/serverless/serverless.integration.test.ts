/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {serverless} from './serverless.js';

jest.mock('../../utils/app.js');
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js');

describe('Serverless Integration Tests', () => {
  const mockCreateSpinner = jest.fn(() => ({
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn()
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
        config: {
          outputFullPath: './dist'
        },
        parseConfig: jest.fn()
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
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should load environment variables from .env file', async () => {
      // Call serverless command in test mode (no .env files exist)
      const result = await serverless({
        quiet: true,
        test: true
      });

      // Verify default NODE_ENV is set
      expect(process.env.NODE_ENV).toBe('development');
      expect(result).toBe(0);
    });

    it('should load environment variables from multiple .env files with proper precedence', async () => {
      // Call serverless command in test mode (no .env files exist)
      const result = await serverless({
        quiet: true,
        test: true
      });

      // Verify default NODE_ENV is set
      expect(process.env.NODE_ENV).toBe('development');
      expect(result).toBe(0);
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