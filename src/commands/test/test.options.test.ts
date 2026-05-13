import {execa} from 'execa';
import path from 'path';

import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as file from '../../utils/file.js';
import * as logUtils from '../../utils/log.js';
import {test, TestOptions} from './test.js';

vi.mock('execa');
vi.mock('fs', async () => ({
  existsSync: vi.fn(() => true),
  readFileSync: vi.fn(() => '{"type": "module"}')
}));
vi.mock('path');
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
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  createSpinner: vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn()
  }))
}));
vi.mock('../../utils/file.js', async () => ({
  getDirName: vi.fn(() => '/mock/dir'),
  relativeNodePath: vi.fn(() => '/node_modules/vitest/vitest.mjs'),
  resolveBinaryPath: vi.fn(() => '/mock/path/to/vitest')
}));
vi.mock('../../utils/log.js');
vi.mock('../ai/ai.js');
vi.mock('glob', async () => ({
  sync: vi.fn(() => [])
}));

describe('test options tests', () => {
  let mockSpinner: any;
  let mockCallback: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    (execa as unknown as MockedFunction<typeof execa>).mockResolvedValue({exitCode: 0, stderr: '', stdout: ''} as any);

    mockSpinner = {
      fail: vi.fn(),
      start: vi.fn(),
      succeed: vi.fn()
    };
    (app.createSpinner as Mock).mockReturnValue(mockSpinner);

    (LexConfig.parseConfig as Mock).mockResolvedValue({} as never);
    (LexConfig.config as any) = {
      useTypescript: true
    };
    (LexConfig.checkTypescriptConfig as Mock).mockImplementation(() => {});

    (path.resolve as Mock).mockImplementation((...args) => args.join('/'));

    (file.relativeNodePath as Mock).mockReturnValue('/node_modules/vitest/vitest.mjs');

    mockCallback = vi.fn();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  const getExecaCalls = () => (execa as unknown as MockedFunction<typeof execa>).mock.calls;
  const getExecaEnv = () => {
    const call = getExecaCalls()[0] as unknown as any[];
    const thirdArg = call[2];
    const secondArg = call[1];
    const options = thirdArg ?? (!Array.isArray(secondArg) ? secondArg : undefined);

    return options?.env;
  };

  it('should pass bail option to Vitest when specified', async () => {
    const options: TestOptions = {
      quiet: false,
      bail: true
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const vitestArgs = getExecaCalls()[0][1];

    expect(vitestArgs).toContain('--bail');
    expect(vitestArgs).toContain('1');
  });

  it('should pass changedFilesWithAncestor option to Vitest when specified', async () => {
    const options: TestOptions = {
      quiet: false,
      changedFilesWithAncestor: true
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const vitestArgs = getExecaCalls()[0][1];

    expect(vitestArgs).toContain('--changed');
  });

  it('should pass changedSince option to Vitest when specified', async () => {
    const options: TestOptions = {
      quiet: false,
      changedSince: 'main'
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const vitestArgs = getExecaCalls()[0][1];

    expect(vitestArgs).toContain('--changed');
    expect(vitestArgs).toContain('main');
  });

  it('should pass ci option to Vitest when specified', async () => {
    const options: TestOptions = {
      quiet: false,
      ci: true
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const vitestArgs = getExecaCalls()[0][1];

    expect(vitestArgs).toContain('--run');
  });

  it('should pass collectCoverageFrom option to Vitest when specified', async () => {
    const coveragePattern = 'src/**/*.{ts,tsx}';
    const options: TestOptions = {
      quiet: false,
      collectCoverageFrom: coveragePattern
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const vitestArgs = getExecaCalls()[0][1];

    expect(vitestArgs).toContain('--coverage');
    expect(vitestArgs).toContain('--coverage.include');
    expect(vitestArgs).toContain(coveragePattern);
  });

  it('should pass colors option to Vitest when specified', async () => {
    const options: TestOptions = {
      quiet: false,
      colors: true
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const vitestEnv = getExecaEnv();

    expect(vitestEnv?.FORCE_COLOR).toBe('1');
  });

  it('should pass config option to Vitest when specified', async () => {
    const customConfig = './custom-vitest.config.js';
    const options: TestOptions = {
      quiet: false,
      config: customConfig
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const vitestArgs = getExecaCalls()[0][1];

    expect(vitestArgs).toContain('--config');
    expect(vitestArgs).toContain(customConfig);
  });

  it('should pass debug option to Vitest when specified', async () => {
    const options: TestOptions = {
      quiet: false,
      debug: true
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const vitestArgs = getExecaCalls()[0][1];

    expect(vitestArgs).toContain('--inspect');
  });

  it('should pass detectOpenHandles option to Vitest when specified', async () => {
    const options: TestOptions = {
      quiet: false,
      detectOpenHandles: true
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const vitestArgs = getExecaCalls()[0][1];

    expect(vitestArgs).toContain('--reporter');
    expect(vitestArgs).toContain('hanging-process');
  });

  it('should handle multiple options correctly', async () => {
    const options: TestOptions = {
      quiet: false,
      bail: true,
      ci: true,
      colors: true,
      verbose: true,
      detectOpenHandles: true
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const vitestCall = getExecaCalls()[0];
    const vitestArgs = vitestCall[1];

    expect(vitestArgs).toContain('--bail');
    expect(vitestArgs).toContain('--run');
    expect(vitestArgs).toContain('--reporter');
    expect(vitestArgs).toContain('verbose');
    expect(vitestArgs).toContain('hanging-process');
    expect(getExecaEnv()?.FORCE_COLOR).toBe('1');
  });

  it('should handle custom CLI name', async () => {
    const options: TestOptions = {
      quiet: false,
      cliName: 'CustomTester'
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    expect(logUtils.log).toHaveBeenCalledWith('CustomTester testing...', 'info', false);
  });

  it('should skip TypeScript checks when useTypescript is false', async () => {
    (LexConfig.config as any).useTypescript = false;

    const options: TestOptions = {
      quiet: false
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    expect(LexConfig.checkTypescriptConfig).not.toHaveBeenCalled();
  });

  it('should handle custom setup file', async () => {
    const setupFile = './custom-setup.js';
    const options: TestOptions = {
      quiet: false,
      setup: setupFile
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const vitestEnv = getExecaEnv();

    expect(vitestEnv?.LEX_VITEST_SETUP).toBe(setupFile);
  });

  it('should handle watch option', async () => {
    const watchPattern = 'src/**/*.ts';
    const options: TestOptions = {
      quiet: false,
      watch: watchPattern
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const vitestArgs = getExecaCalls()[0][1];

    expect(vitestArgs).toContain('watch');
    expect(vitestArgs).toContain(watchPattern);
  });

  it('should handle watchAll option', async () => {
    const options: TestOptions = {
      quiet: false,
      watchAll: true
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const vitestArgs = getExecaCalls()[0][1];

    expect(vitestArgs).toContain('watch');
  });

  it('should handle update option for snapshots', async () => {
    const options: TestOptions = {
      quiet: false,
      update: true
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const vitestArgs = getExecaCalls()[0][1];

    expect(vitestArgs).toContain('--update');
  });

  it('should pass e2e-only execution to Playwright', async () => {
    const options: TestOptions = {
      quiet: false,
      e2e: true,
      maxWorkers: '2',
      runInBand: true,
      testNamePattern: 'smoke'
    };

    await test(options, [], mockCallback as unknown as typeof process.exit);

    const playwrightArgs = getExecaCalls()[0][1];

    expect(getExecaCalls()[0][0]).toContain('playwright');
    expect(playwrightArgs).toContain('test');
    expect(playwrightArgs).toContain('--workers');
    expect(playwrightArgs).toContain('1');
    expect(playwrightArgs).toContain('--grep');
    expect(playwrightArgs).toContain('smoke');
  });
});
