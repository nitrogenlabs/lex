import {execa} from 'execa';
import * as fs from 'fs';

import {test, TestOptions} from './test.js';
import * as app from '../../utils/app.js';
import * as logUtils from '../../utils/log.js';

vi.mock('execa');
vi.mock('fs', async () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn()
}));
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  createSpinner: vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn()
  }))
}));
vi.mock('../../utils/log.js');
vi.mock('../../LexConfig.js', async () => ({
  LexConfig: {
    checkTestTypescriptConfig: vi.fn(),
    checkTypescriptConfig: vi.fn(),
    config: {
      useTypescript: true
    },
    getLexDir: vi.fn(() => '/mock/lex/dir'),
    parseConfig: vi.fn().mockResolvedValue(undefined)
  },
  getTypeScriptConfigPath: vi.fn(() => 'tsconfig.test.json')
}));
vi.mock('../../utils/file.js', async () => ({
  getDirName: vi.fn(() => '/mock/dir'),
  relativeNodePath: vi.fn(() => '/node_modules/vitest/vitest.mjs'),
  resolveBinaryPath: vi.fn(() => '/node_modules/vitest/vitest.mjs')
}));
vi.mock('glob', async () => ({
  sync: vi.fn(() => ['test1.js', 'test2.js'])
}));

describe('test.cli', () => {
  const mockCallback = vi.fn();
  let mockSpinner: {
    start: Mock;
    succeed: Mock;
    fail: Mock;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (execa as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);

    mockSpinner = {
      fail: vi.fn(),
      start: vi.fn(),
      succeed: vi.fn()
    };
    (app.createSpinner as Mock).mockReturnValue(mockSpinner);

    (fs.existsSync as Mock).mockReturnValue(true);
    (fs.readFileSync as Mock).mockReturnValue('{"scripts": {"test": "vitest"}}');
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('test function', () => {
    it('should run Vitest with default options', async () => {
      const options: TestOptions = {};
      const result = await test(options, [], mockCallback as any);

      expect(result).toBe(0);
      expect(mockCallback).toHaveBeenCalledWith(0);
      expect(mockSpinner.succeed).toHaveBeenCalledWith('Testing completed!');

      expect(execa as unknown as Mock).toHaveBeenCalledWith(
        expect.stringContaining('vitest'),
        expect.arrayContaining(['run', '--config']),
        expect.objectContaining({encoding: 'utf8'})
      );
    });

    it('should propagate Vitest errors', async () => {
      const options: TestOptions = {};
      (execa as MockedFunction<typeof execa>).mockRejectedValueOnce(new Error('Test failed'));
      const result = await test(options, [], mockCallback as any);

      expect(logUtils.log as Mock).toHaveBeenCalledWith(
        '\nLex Error: Check for unit test errors and/or coverage.', 'error', undefined
      );
      expect(mockSpinner.fail).toHaveBeenCalledWith('Testing failed!');
      expect(result).toBe(1);
      expect(mockCallback).toHaveBeenCalledWith(1);
    });
  });
});
