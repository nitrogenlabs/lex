import {mkdirSync, readFileSync, rmSync, writeFileSync} from 'fs';
import {tmpdir} from 'os';
import {join} from 'path';

import {defaultConfigValues, LexConfig} from '../../LexConfig.js';
import {createLexViteConfig} from './config.js';

describe('Lex Vite config', () => {
  const directory = join(tmpdir(), 'lex-vite-config-test');
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
    LexConfig.config = originalConfig;
    rmSync(directory, {force: true, recursive: true});
  });

  it('uses a script entry and includes the Lex plugin stack', () => {
    writeFileSync(join(directory, 'src/index.js'), 'export default true;');
    const config = createLexViteConfig({analyze: true, command: 'build'});
    const pluginNames = (config.plugins || []).flat().map((plugin) => (
      plugin && typeof plugin === 'object' && 'name' in plugin ? plugin.name : ''
    ));

    expect(config.appType).toBe('custom');
    expect(config.build?.rolldownOptions?.input).toBe(join(directory, 'src/index.js'));
    expect(pluginNames).toEqual(expect.arrayContaining([
      'lex-empty-crypto',
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

    const graphql = findPlugin('lex-graphql');
    expect(graphql.load(graphqlFile)).toContain('query Viewer');
    expect(graphql.load(sourceFile)).toBeNull();

    const swc = findPlugin('lex-swc');
    expect((await swc.transform(readFileSync(sourceFile, 'utf8'), sourceFile)).code).toContain("from 'react'");
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
