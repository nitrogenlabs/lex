import {execa} from 'execa';
import * as fs from 'fs';

import {test, TestOptions} from './test.js';
import * as app from '../../utils/app.js';
import * as logUtils from '../../utils/log.js';

jest.mock('execa');
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn()
}));
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    start: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn()
  }))
}));
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js', () => ({
  LexConfig: {
    parseConfig: jest.fn().mockResolvedValue(undefined),
    config: {
      useTypescript: true
    },
    checkTypescriptConfig: jest.fn(),
    checkTestTypescriptConfig: jest.fn(),
    getLexDir: jest.fn(() => '/mock/lex/dir')
  },
  getTypeScriptConfigPath: jest.fn(() => 'tsconfig.test.json'),
  getLexDir: jest.fn(() => '/mock/lex/dir')
}));
jest.mock('../../utils/file.js', () => ({
  getDirName: jest.fn(() => '/mock/dir'),
  resolveBinaryPath: jest.fn(() => '/node_modules/jest-cli/bin/jest.js'),
  relativeNodePath: jest.fn(() => '/node_modules/jest-cli/bin/jest.js')
}));
jest.mock('glob', () => ({
  sync: jest.fn(() => ['test1.js', 'test2.js'])
}));

describe('test.cli', () => {
  const mockCallback = jest.fn();
  let mockSpinner: {
    start: jest.Mock;
    succeed: jest.Mock;
    fail: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({stdout: '', stderr: '', exitCode: 0} as any);

    mockSpinner = {
      start: jest.fn(),
      succeed: jest.fn(),
      fail: jest.fn()
    };
    (app.createSpinner as jest.Mock).mockReturnValue(mockSpinner);

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('{"scripts": {"test": "jest"}}');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('test function', () => {
    it('should run Jest with default options', async () => {
      const options: TestOptions = {};
      const result = await test(options, [], mockCallback as any);

      expect(result).toBe(0);
      expect(mockCallback).toHaveBeenCalledWith(0);
      expect(mockSpinner.succeed).toHaveBeenCalledWith('Testing completed!');

      expect(execa as unknown as jest.Mock).toHaveBeenCalledWith(
        expect.stringContaining('jest'),
        expect.arrayContaining(['--no-cache', '--config']),
        expect.objectContaining({encoding: 'utf8'})
      );
    });

    it('should propagate Jest errors', async () => {
      const options: TestOptions = {};
      (execa as jest.MockedFunction<typeof execa>).mockRejectedValueOnce(new Error('Test failed'));
      const result = await test(options, [], mockCallback as any);

      expect(logUtils.log as jest.Mock).toHaveBeenCalledWith(
        '\nLex Error: Check for unit test errors and/or coverage.', 'error', undefined
      );
      expect(mockSpinner.fail).toHaveBeenCalledWith('Testing failed!');
      expect(result).toBe(1);
      expect(mockCallback).toHaveBeenCalledWith(1);
    });
  });
});