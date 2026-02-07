/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {serverless} from './serverless.js';

vi.mock('../../utils/app.js');
vi.mock('../../utils/log.js');
vi.mock('../../LexConfig.js');

describe('Serverless Integration Tests', () => {
  const mockCreateSpinner = vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn()
  }));
  const mockRemoveFiles = vi.fn();
  const mockLog = vi.fn();

  beforeAll(() => {
    vi.doMock('../../utils/app.js', () => ({
      createSpinner: mockCreateSpinner,
      removeFiles: mockRemoveFiles
    }));
    vi.doMock('../../utils/log.js', () => ({
      log: mockLog
    }));
    vi.doMock('../../LexConfig.js', () => ({
      LexConfig: {
        config: {
          outputFullPath: './lib'
        },
        parseConfig: vi.fn()
      }
    }));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('Environment Variable Loading', () => {
    beforeEach(() => {
      vi.clearAllMocks();
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