import {createServer} from 'vite';

import {LexConfig} from '../../LexConfig.js';
import {dev} from './dev.js';

vi.mock('vite', () => ({createServer: vi.fn()}));
vi.mock('../../LexConfig.js', () => ({
  LexConfig: {
    checkTypescriptConfig: vi.fn(),
    config: {dev: {}, outputFullPath: '/mock/output', sourceFullPath: '/mock/source', targetEnvironment: 'web', useTypescript: false},
    getLexDir: vi.fn(() => '/mock/lex'),
    getSWCConfigWithReactCompiler: vi.fn(() => ({})),
    parseConfig: vi.fn()
  }
}));
vi.mock('../../utils/vite/config.js', () => ({
  createLexViteConfig: vi.fn((options) => ({server: {port: options.port}}))
}));
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  createSpinner: vi.fn(() => ({fail: vi.fn(), start: vi.fn(), succeed: vi.fn()})),
  removeFiles: vi.fn()
}));

describe('dev', () => {
  const listen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (LexConfig.config as any).dev = {};
    (createServer as MockedFunction<typeof createServer>).mockResolvedValue({listen} as any);
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it('starts Vite on the default port', async () => {
    expect(await dev({quiet: true})).toBe(0);
    expect(createServer).toHaveBeenCalledWith(expect.objectContaining({server: {port: 3000}}));
    expect(listen).toHaveBeenCalledOnce();
  });

  it('prefers the CLI port over the configured port', async () => {
    (LexConfig.config as any).dev = {port: 4200};
    await dev({port: 8080, quiet: true});
    expect(createServer).toHaveBeenCalledWith(expect.objectContaining({server: {port: 8080}}));
  });

  it('returns a failure when Vite cannot start', async () => {
    (createServer as MockedFunction<typeof createServer>).mockRejectedValue(new Error('failed'));
    expect(await dev({quiet: true})).toBe(1);
  });
});
