import {execa} from 'execa';

import {test, type TestCallback} from './test.js';

vi.mock('execa');
vi.mock('../ai/ai.js', async () => ({
  aiFunction: vi.fn()
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
  resolveBinaryPath: vi.fn(() => '/mock/path/to/vitest')
}));
vi.mock('fs', async () => ({
  existsSync: vi.fn((path: string) => {
    // Handle undefined or null paths
    if(!path) {
      return false;
    }

    return true;
  }),
  readFileSync: vi.fn((path: string) => {
    if(path.includes('package.json')) {
      return '{"type": "module", "scripts": {"test": "vitest"}}';
    }
    return '{"type": "module"}';
  }),
  writeFileSync: vi.fn()
}));
vi.mock('glob', async () => ({
  sync: vi.fn(() => [])
}));
vi.mock('path');
vi.mock('url');

describe('test integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('should run tests successfully', async () => {
    const callback = vi.fn() as unknown as TestCallback;
    (execa as MockedFunction<typeof execa>).mockResolvedValue({stdout: '', stderr: '', exitCode: 0} as any);

    await test({}, [], callback);

    expect(execa).toHaveBeenCalled();
  });

  it('should handle test errors', async () => {
    (execa as MockedFunction<typeof execa>).mockRejectedValueOnce(new Error('AI service unavailable'));
    const callback = vi.fn() as unknown as TestCallback;
    const result = await test({}, [], callback);

    expect(result).toBe(1);
  });
});
