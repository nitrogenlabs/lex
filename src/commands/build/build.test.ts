import {build as viteBuild} from 'vite';

import {LexConfig} from '../../LexConfig.js';
import {build, buildWithVite} from './build.js';

vi.mock('vite', () => ({build: vi.fn(), createServer: vi.fn()}));
vi.mock('../../utils/vite/config.js', () => ({createLexViteConfig: vi.fn(() => ({}))}));
vi.mock('../../utils/vite/assets.js', () => ({
  compressLexWebAssets: vi.fn(),
  copyLexWebAssets: vi.fn(),
  optimizeLexWebAssets: vi.fn()
}));
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  checkLinkedModules: vi.fn(),
  copyConfiguredFiles: vi.fn(),
  createSpinner: vi.fn(() => ({fail: vi.fn(), start: vi.fn(), succeed: vi.fn()})),
  removeFiles: vi.fn()
}));
vi.mock('../../LexConfig.js', () => ({
  LexConfig: {
    config: {outputFullPath: '/mock/output', targetEnvironment: 'web', useTypescript: false},
    parseConfig: vi.fn(),
    getTypeScriptDeclarationFlags: vi.fn(() => [])
  }
}));

describe('build', () => {
  const spinner = {fail: vi.fn(), start: vi.fn(), succeed: vi.fn()};

  beforeEach(() => {
    vi.clearAllMocks();
    (viteBuild as MockedFunction<typeof viteBuild>).mockResolvedValue({} as any);
  });

  it('uses Vite for web projects by default', async () => {
    expect(await build({quiet: true})).toBe(0);
    expect(viteBuild).toHaveBeenCalledOnce();
  });

  it('builds web projects with Vite', async () => {
    expect(await buildWithVite(spinner, {quiet: true}, vi.fn())).toBe(0);
    expect(viteBuild).toHaveBeenCalledOnce();
  });

  it('reports Vite build failures', async () => {
    (viteBuild as MockedFunction<typeof viteBuild>).mockRejectedValue(new Error('build failed'));
    expect(await buildWithVite(spinner, {quiet: true}, vi.fn())).toBe(1);
  });
});
