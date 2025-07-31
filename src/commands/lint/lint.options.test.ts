import {execa} from 'execa';

import {lint} from './lint.js';

jest.mock('execa');
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    start: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn()
  }))
}));
jest.mock('../../utils/log.js');
jest.mock('../../LexConfig.js');
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => '{"type": "module"}'),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn()
}));
jest.mock('path', () => ({
  resolve: jest.fn((...args) => args.join('/')),
  dirname: jest.fn(() => '/mock/dir')
}));
jest.mock('glob', () => ({
  sync: jest.fn()
}));

describe('lint options', () => {
  let processExitSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeAll(() => {
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({stdout: '', stderr: '', exitCode: 0} as any);
  });

  afterAll(() => {
    processExitSpy.mockRestore();
    consoleLogSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('should handle default options', async () => {
    const result = await lint({});

    expect(result).toBe(0);
  });

  it('should handle fix option', async () => {
    const result = await lint({fix: true});

    expect(result).toBe(0);
  });

  it('should handle config option', async () => {
    const result = await lint({config: 'eslint.config.mjs'});

    expect(result).toBe(0);
  });

  it('should handle quiet option', async () => {
    const result = await lint({quiet: true});

    expect(result).toBe(0);
  });

  it('should handle debug option', async () => {
    const result = await lint({debug: true});

    expect(result).toBe(0);
  });

  it('should handle noColor option', async () => {
    const result = await lint({noColor: true});

    expect(result).toBe(0);
  });

  it('should handle cliName option', async () => {
    const result = await lint({cliName: 'CustomLinter'});

    expect(result).toBe(0);
  });
});