import {transform} from '@swc/core';
import {execa} from 'execa';
import {existsSync, readFileSync, writeFileSync} from 'fs';
import {sync as globSync} from 'glob';
import {build as viteBuild} from 'vite';

import {build, buildWithVite} from './build.js';

const state = vi.hoisted(() => ({
  config: {
    outputFullPath: '/mock/output',
    sourceFullPath: '/mock/source',
    swc: {},
    targetEnvironment: 'web',
    useTypescript: false
  },
  declarationFlags: ['--emitDeclarationOnly', '--declaration', '--outDir', '/mock/types', '--rootDir', '/mock/source']
}));

vi.mock('@swc/core', () => ({transform: vi.fn()}));
vi.mock('execa', () => ({execa: vi.fn(async () => ({exitCode: 0}))}));
vi.mock('fs');
vi.mock('glob', () => ({sync: vi.fn()}));
vi.mock('vite', () => ({build: vi.fn(), createServer: vi.fn()}));
vi.mock('../../utils/file.js', () => ({resolveBinaryPath: vi.fn(() => '/mock/bin/tsc')}));
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
    config: state.config,
    parseConfig: vi.fn(),
    getTypeScriptDeclarationFlags: vi.fn(() => state.declarationFlags)
  }
}));

describe('build', () => {
  const spinner = {fail: vi.fn(), start: vi.fn(), succeed: vi.fn()};

  beforeEach(() => {
    vi.clearAllMocks();
    state.config.useTypescript = false;
    (viteBuild as MockedFunction<typeof viteBuild>).mockResolvedValue({} as any);
  });

  afterEach(() => {
    state.config.useTypescript = false;
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

  it('emits SWC output and forwards declaration flags with discovered source files', async () => {
    const environment = process.env;
    const callback = vi.fn();
    state.config.useTypescript = true;
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue('export const value: number = 7;');
    vi.mocked(transform).mockResolvedValue({code: 'export const value = 7;'});
    vi.mocked(globSync)
      .mockReturnValueOnce(['/mock/source/value.ts'])
      .mockReturnValueOnce([])
      .mockReturnValueOnce(['/mock/source/value.ts'])
      .mockReturnValueOnce(['/mock/source/view.tsx']);

    try {
      expect(await build({bundler: 'swc', quiet: true}, callback)).toBe(0);
      expect(writeFileSync).toHaveBeenCalledWith('/mock/output/value.js', 'export const value = 7;');
      expect(callback).toHaveBeenCalledWith(0);
      expect(execa).toHaveBeenCalledWith('/mock/bin/tsc', [
        '--emitDeclarationOnly', '--declaration', '--outDir', '/mock/types', '--rootDir', '/mock/source',
        '/mock/source/value.ts', '/mock/source/view.tsx'
      ], {all: true, cwd: process.cwd(), encoding: 'utf8', reject: false});
    } finally {
      process.env = environment;
    }
  });
});
