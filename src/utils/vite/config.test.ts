import {mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync} from 'fs';
import {tmpdir} from 'os';
import {join} from 'path';

import {defaultConfigValues, LexConfig} from '../../LexConfig.js';
import {browserGlobalModules, createLexViteConfig, getBrowserGlobalInjectOptions, resolveProjectPackage} from './config.js';

describe('Lex Vite config', () => {
  const directory = join(tmpdir(), 'lex-vite-config-test');
  const originalCwd = process.cwd();
  const originalConfig = LexConfig.config;

  beforeEach(() => {
    mkdirSync(join(directory, 'src'), {recursive: true});
    LexConfig.config = {
      ...defaultConfigValues,
      outputFullPath: join(directory, 'dist'),
      sourceFullPath: join(directory, 'src')
    };
  });

  afterEach(() => {
    process.chdir(originalCwd);
    LexConfig.config = originalConfig;
    rmSync(directory, {force: true, recursive: true});
  });

  it('resolves browser dependencies hoisted above a workspace package', () => {
    const workspacePath = join(directory, 'apps/ui');
    const packagePath = join(directory, 'node_modules/example-package');
    mkdirSync(workspacePath, {recursive: true});
    mkdirSync(packagePath, {recursive: true});
    writeFileSync(join(packagePath, 'browser.js'), 'export default {};');
    process.chdir(workspacePath);

    expect(resolveProjectPackage('example-package/browser.js')).toBe(realpathSync(join(packagePath, 'browser.js')));
  });

  it('uses a script entry and includes the Lex plugin stack', () => {
    writeFileSync(join(directory, 'src/index.js'), 'export default true;');
    const config = createLexViteConfig({analyze: true, command: 'build'});
    const pluginNames = (config.plugins || []).flat().map((plugin) => (
      plugin && typeof plugin === 'object' && 'name' in plugin ? plugin.name : ''
    ));

    expect(config.appType).toBe('custom');
    expect(config.build?.rolldownOptions?.input).toBe(join(directory, 'src/index.js'));
    expect(config.define?.global).toBe('globalThis');
    expect(config.optimizeDeps?.include).toEqual(['buffer/index.js', 'process/browser.js']);
    expect(pluginNames).toEqual(expect.arrayContaining([
      'lex-empty-crypto',
      'lex-node-polyfills',
      'lex-swc',
      'lex-graphql',
      'lex-import-meta-compatibility',
      'lex-assets-dev',
      'lex-bundle-analyzer'
    ]));

    const output = config.build?.rolldownOptions?.output as any;

    expect(output.manualChunks('/project/node_modules/react/index.js')).toBe('vendors');
    expect(output.manualChunks('/project/src/index.js')).toBeUndefined();
  });

  it('injects browser globals through package imports that Vite can optimize', () => {
    expect(browserGlobalModules).toEqual({
      Buffer: ['buffer/index.js', 'Buffer'],
      process: ['process/browser.js', 'default']
    });
    expect(getBrowserGlobalInjectOptions('serve')).toEqual({
      ...browserGlobalModules,
      exclude: [
        '**/node_modules/buffer/**',
        '**/node_modules/process/**'
      ]
    });
    expect(getBrowserGlobalInjectOptions('build')).toEqual({
      Buffer: [resolveProjectPackage('buffer/index.js'), 'Buffer'],
      exclude: [
        '**/node_modules/buffer/**',
        '**/node_modules/process/**'
      ],
      process: [resolveProjectPackage('process/browser.js'), 'default']
    });
  });

  it('uses HTML as the web entry and merges project Vite options', () => {
    writeFileSync(join(directory, 'src/index.html'), '<div></div>');
    LexConfig.config.vite = {base: '/application/'};
    const config = createLexViteConfig({command: 'serve', port: 4100});

    expect(config.appType).toBe('spa');
    expect(config.base).toBe('/application/');
    expect(config.server?.port).toBe(4100);
  });

  it('configures library formats and excludes browser plugins for SSR', () => {
    writeFileSync(join(directory, 'src/index.js'), 'export default true;');
    LexConfig.config.libraryName = 'Example';
    LexConfig.config.libraryTarget = 'umd';

    const library = createLexViteConfig({command: 'build'}).build?.lib;

    expect(library).toEqual(expect.objectContaining({formats: ['umd'], name: 'Example'}));
    expect((library as any).fileName()).toBe('index.js');

    LexConfig.config.libraryTarget = 'commonjs2';

    expect((createLexViteConfig({command: 'build'}).build?.lib as any).formats).toEqual(['cjs']);

    LexConfig.config.libraryTarget = 'window';

    expect((createLexViteConfig({command: 'build'}).build?.lib as any).formats).toEqual(['iife']);

    LexConfig.config.libraryTarget = undefined;

    expect((createLexViteConfig({command: 'build'}).build?.lib as any).formats).toEqual(['es']);

    const ssrPlugins = (createLexViteConfig({command: 'serve', ssr: true}).plugins || []).flat();

    expect(ssrPlugins).toHaveLength(2);
  });

  it('runs source, GraphQL, import-meta, crypto, and analyzer plugin hooks', async () => {
    const sourceFile = join(directory, 'src/component.tsx');
    const graphqlFile = join(directory, 'src/query.graphql');
    writeFileSync(sourceFile, 'export const element = React.createElement("div");');
    writeFileSync(graphqlFile, 'query Viewer { viewer { id } }');
    const config = createLexViteConfig({analyze: true, command: 'build'});
    const plugins = (config.plugins || []).flat() as any[];
    const findPlugin = (name: string) => plugins.find((plugin) => plugin?.name === name);

    const crypto = findPlugin('lex-empty-crypto');

    expect(crypto.resolveId('crypto')).toBe('\0lex-empty-crypto');
    expect(crypto.resolveId('other')).toBeNull();
    expect(crypto.load('\0lex-empty-crypto')).toContain('webcrypto');

    const polyfills = findPlugin('lex-node-polyfills');

    expect(polyfills.resolveId('node:path')).toContain('path-browserify/index.js');
    expect(polyfills.resolveId('fs')).toBeNull();

    const graphql = findPlugin('lex-graphql');

    expect(graphql.load(graphqlFile)).toContain('query Viewer');
    expect(graphql.load(sourceFile)).toBeNull();

    const swc = findPlugin('lex-swc');

    expect((await swc.transform(readFileSync(sourceFile, 'utf8'), sourceFile)).code).toContain('from \'react\'');
    expect(await swc.transform('test', '/outside/file.ts')).toBeNull();

    const importMeta = findPlugin('lex-import-meta-compatibility');

    expect(importMeta.transform('export default import.meta.url;', sourceFile)).toContain('document.currentScript');
    expect(importMeta.transform('export default true;', sourceFile)).toBeNull();

    const emitFile = vi.fn();
    findPlugin('lex-bundle-analyzer').generateBundle.call({emitFile}, {}, {
      'asset.txt': {source: 'asset', type: 'asset'},
      'entry.js': {code: 'code', type: 'chunk'}
    });

    expect(emitFile).toHaveBeenCalledWith(expect.objectContaining({fileName: 'bundle-report.json'}));
  });

  it('serves development assets and injects generated favicon HTML', async () => {
    mkdirSync(join(directory, 'src/static'), {recursive: true});
    mkdirSync(join(directory, 'src/images'), {recursive: true});
    writeFileSync(join(directory, 'src/static/file.txt'), 'asset');
    LexConfig.config.vite = {staticPath: join(directory, 'src/static')};
    const config = createLexViteConfig({command: 'serve'});
    const plugins = (config.plugins || []).flat() as any[];
    const assets = plugins.find((plugin) => plugin?.name === 'lex-assets-dev');

    await assets.buildStart();

    expect(assets.transformIndexHtml('<head></head>')).toBe('<head></head>');

    let middleware: any;
    assets.configureServer({middlewares: {use: (handler: any) => (middleware = handler)}});
    const next = vi.fn();
    await middleware({}, {}, next);

    expect(next).toHaveBeenCalledOnce();

    const response = {end: vi.fn(), setHeader: vi.fn(), statusCode: 0};
    await middleware({url: '/file.txt'}, response, next);

    expect(response.statusCode).toBe(200);
    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
    expect(response.end).toHaveBeenCalled();

    const sharp = (await import('sharp')).default;
    await sharp({create: {background: '#ffffff', channels: 4, height: 32, width: 32}})
      .png()
      .toFile(join(directory, 'src/images/logo.png'));
    await assets.buildStart();

    expect(assets.transformIndexHtml('<head></head>')).toContain('apple-touch-icon');
  });
});
