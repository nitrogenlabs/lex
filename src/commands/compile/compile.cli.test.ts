import {transform} from '@swc/core';
import {execa} from 'execa';

import {compile} from './compile.js';

jest.mock('execa');
jest.mock('@swc/core');
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  checkLinkedModules: jest.fn(),
  copyConfiguredFiles: jest.fn().mockResolvedValue(undefined),
  copyFiles: jest.fn().mockResolvedValue(undefined),
  createSpinner: jest.fn(() => ({
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn()
  })),
  getFilesByExt: jest.fn().mockReturnValue([]),
  removeFiles: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../../utils/file.js', () => ({
  getDirName: jest.fn(() => '/mock/dir'),
  resolveBinaryPath: jest.fn((binary) => `/mock/path/to/${binary}`)
}));
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js', () => ({
  LexConfig: {
    checkCompileTypescriptConfig: jest.fn(),
    config: {
      outputFullPath: '/mock/output',
      sourceFullPath: '/mock/source',
      useTypescript: false
      // SWC configuration is handled automatically with optimal defaults
    },
    parseConfig: jest.fn().mockResolvedValue(undefined)
  },
  getTypeScriptConfigPath: jest.fn(() => 'tsconfig.build.json')
}));
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  lstatSync: jest.fn(() => ({isDirectory: () => false})),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(() => 'console.log("test");'),
  readdirSync: jest.fn(() => []),
  writeFileSync: jest.fn()
}));
jest.mock('glob', () => ({
  sync: jest.fn((pattern) => {
    if(pattern.includes('.ts*')) {
      return ['test.ts', 'test.tsx'];
    }
    if(pattern.includes('.js')) {
      return ['test.js', 'test2.js'];
    }
    return [];
  })
}));

describe('compile cli', () => {
  let consoleLogSpy;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should compile with default options', async () => {
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({
      exitCode: 0,
      stderr: '',
      stdout: ''
    } as any);

    (transform as jest.MockedFunction<typeof transform>)
      .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

    const result = await compile({});

    // Debug: Check what the function actually returned
    console.log('Compile result:', result);
    console.log('Execa calls:', (execa as jest.MockedFunction<typeof execa>).mock.calls);
    console.log('Transform calls:', (transform as jest.MockedFunction<typeof transform>).mock.calls);

    expect(result).toBe(0);
    expect(transform).toHaveBeenCalledTimes(4);
  });

  it('should compile with custom config', async () => {
    // Mock LexConfig to enable TypeScript for this test
    const originalConfig = require('../../LexConfig.js').LexConfig.config;
    require('../../LexConfig.js').LexConfig.config = {
      ...originalConfig,
      useTypescript: true
    };

    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({
      exitCode: 0,
      stderr: '',
      stdout: ''
    } as any);

    (transform as jest.MockedFunction<typeof transform>)
      .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

    await compile({config: 'tsconfig.custom.json'});

    expect(execa).toHaveBeenCalledWith(
      expect.stringContaining('tsc'),
      ['-p', 'tsconfig.custom.json'],
      expect.any(Object)
    );
    expect(transform).toHaveBeenCalledTimes(4);

    // Restore original config
    require('../../LexConfig.js').LexConfig.config = originalConfig;
  });

  it('should compile with watch mode', async () => {
    // Mock LexConfig to enable TypeScript for this test
    const originalConfig = require('../../LexConfig.js').LexConfig.config;
    require('../../LexConfig.js').LexConfig.config = {
      ...originalConfig,
      useTypescript: true
    };

    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({
      exitCode: 0,
      stderr: '',
      stdout: ''
    } as any);

    (transform as jest.MockedFunction<typeof transform>)
      .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any);

    await compile({watch: true});

    expect(execa).toHaveBeenCalledWith(
      expect.stringContaining('tsc'),
      expect.arrayContaining(['-p', 'tsconfig.build.json']),
      expect.any(Object)
    );
    expect(transform).toHaveBeenCalledTimes(4);

    // Restore original config
    require('../../LexConfig.js').LexConfig.config = originalConfig;
  });

  it('should handle TypeScript compilation errors', async () => {
    // Mock LexConfig to enable TypeScript for this test
    const originalConfig = require('../../LexConfig.js').LexConfig.config;
    require('../../LexConfig.js').LexConfig.config = {
      ...originalConfig,
      useTypescript: true
    };

    (execa as jest.MockedFunction<typeof execa>).mockRejectedValueOnce(new Error('TypeScript compilation failed'));

    const result = await compile({});

    expect(result).toBe(1);

    // Restore original config
    require('../../LexConfig.js').LexConfig.config = originalConfig;
  });

  it('should handle SWC compilation errors', async () => {
    (execa as jest.MockedFunction<typeof execa>)
      .mockResolvedValueOnce({exitCode: 0, stderr: '', stdout: ''} as any); // tsc success

    (transform as jest.MockedFunction<typeof transform>)
      .mockRejectedValue(new Error('SWC compilation failed')); // SWC failure

    const result = await compile({});

    expect(result).toBe(1);
  });

  it('should accept format option and default to esm', async () => {
    (execa as jest.MockedFunction<typeof execa>)
      .mockResolvedValueOnce({exitCode: 0, stderr: '', stdout: ''} as any); // tsc success

    (transform as jest.MockedFunction<typeof transform>)
      .mockResolvedValue({code: 'console.log("compiled");', map: ''} as any); // SWC success

    const result = await compile({format: 'cjs'});

    expect(result).toBe(0);
    expect(transform).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        module: expect.objectContaining({
          type: 'commonjs'
        })
      })
    );
  });
});
