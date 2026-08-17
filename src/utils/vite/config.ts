/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {transform} from '@swc/core';
import inject from '@rollup/plugin-inject';
import {existsSync, readFileSync} from 'fs';
import {extname, resolve} from 'path';
import {mergeConfig} from 'vite';
import {nodePolyfills} from 'vite-plugin-node-polyfills';

import {LexConfig} from '../../LexConfig.js';
import {generateLexFavicons, getDevAsset} from './assets.js';

import type {InlineConfig, Plugin} from 'vite';

const createInjectPlugin = inject as unknown as (options: Record<string, unknown>) => Plugin;

export interface LexViteOptions {
  readonly analyze?: boolean;
  readonly command: 'build' | 'serve';
  readonly entry?: string;
  readonly mode?: string;
  readonly open?: boolean;
  readonly port?: number;
  readonly quiet?: boolean;
  readonly ssr?: boolean;
}

const contentTypes: Record<string, string> = {
  '.css': 'text/css',
  '.gif': 'image/gif',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const emptyCryptoPlugin = (): Plugin => ({
  load(id) {
    return id === '\0lex-empty-crypto' ? 'export default {}; export const webcrypto = undefined;' : null;
  },
  name: 'lex-empty-crypto',
  resolveId(id) {
    return id === 'crypto' || id === 'node:crypto' ? '\0lex-empty-crypto' : null;
  }
});

const graphqlPlugin = (): Plugin => ({
  load(id) {
    if(!/\.(gql|graphql)$/.test(id)) return null;
    const source = JSON.stringify(readFileSync(id, 'utf8'));
    return `import gql from 'graphql-tag'; export default gql(${source});`;
  },
  name: 'lex-graphql'
});

const swcPlugin = (sourcePath: string): Plugin => ({
  enforce: 'pre',
  async transform(source, id) {
    const cleanId = id.split('?')[0];
    if(!cleanId.startsWith(sourcePath) || !/\.[jt]sx?$/.test(cleanId) || /\.(test|spec|integration|e2e)\.[jt]sx?$/.test(cleanId)) return null;

    const swcConfig = LexConfig.getSWCConfigWithReactCompiler();
    const result = await transform(source, {
      ...swcConfig,
      filename: cleanId,
      module: {...swcConfig?.module, type: 'es6'},
      sourceMaps: true
    });

    const needsReact = /\bReact\s*\./.test(result.code) && !/from\s+['"]react['"]/.test(result.code);
    return {
      code: needsReact ? `import React from 'react';\n${result.code}` : result.code,
      map: result.map || null
    };
  },
  name: 'lex-swc'
});

const importMetaCompatibilityPlugin = (sourcePath: string): Plugin => ({
  enforce: 'post',
  name: 'lex-import-meta-compatibility',
  transform(source, id) {
    const cleanId = id.split('?')[0];
    if(!cleanId.startsWith(sourcePath) || !source.includes('import.meta.url')) return null;

    const replacement = '(typeof document !== "undefined" && document.currentScript && document.currentScript.src ? new URL(document.currentScript.src, window.location.href).href : (typeof window !== "undefined" ? new URL("", window.location.href).href : ""))';
    return source.replaceAll('import.meta.url', replacement);
  }
});

const assetsDevPlugin = (): Plugin => {
  let faviconHtml: string[] = [];

  return {
    async buildStart() {
      const generatedFavicons = await generateLexFavicons(LexConfig.config);
      faviconHtml = generatedFavicons?.html || [];
    },
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if(!request.url) return next();
        const asset = await getDevAsset(LexConfig.config, request.url);
        if(!asset) return next();

        response.statusCode = 200;
        response.setHeader('Content-Type', contentTypes[extname(request.url.split('?')[0])] || 'application/octet-stream');
        response.end(asset);
      });
    },
    name: 'lex-assets-dev',
    transformIndexHtml(html) {
      if(faviconHtml.length === 0) return html;
      return html.replace('</head>', `    ${faviconHtml.join('\n    ')}\n  </head>`);
    }
  };
};

const analyzerPlugin = (enabled: boolean): Plugin => ({
  generateBundle(_options, bundle) {
    if(!enabled) return;

    const report = Object.entries(bundle).map(([fileName, output]) => ({
      fileName,
      size: output.type === 'asset'
        ? Buffer.byteLength(typeof output.source === 'string' ? output.source : output.source)
        : Buffer.byteLength(output.code),
      type: output.type
    }));

    this.emitFile({fileName: 'bundle-report.json', source: JSON.stringify(report, null, 2), type: 'asset'});
  },
  name: 'lex-bundle-analyzer'
});

const getLibraryFormats = (libraryTarget?: string): Array<'cjs' | 'es' | 'iife' | 'umd'> => {
  if(libraryTarget === 'commonjs' || libraryTarget === 'commonjs2') return ['cjs'];
  if(libraryTarget === 'var' || libraryTarget === 'window') return ['iife'];
  if(libraryTarget === 'umd') return ['umd'];
  return ['es'];
};

const resolveProjectPackage = (packageName: string): string => {
  const projectPackage = resolve(process.cwd(), 'node_modules', packageName);
  return existsSync(projectPackage) ? projectPackage : resolve(LexConfig.getLexDir(), 'node_modules', packageName);
};

export const createLexViteConfig = (options: LexViteOptions): InlineConfig => {
  const config = LexConfig.config;
  const sourcePath = config.sourceFullPath || resolve(process.cwd(), config.sourcePath || './src');
  const outputPath = config.outputFullPath || resolve(process.cwd(), config.outputPath || './lib');
  const entryPath = resolve(sourcePath, options.entry || config.entryJs || 'index.js');
  const htmlPath = resolve(sourcePath, config.entryHTML || 'index.html');
  const hasHtmlEntry = existsSync(htmlPath) && !options.ssr;
  const outputHash = config.outputHash || options.mode === 'production';
  const fileName = config.outputFile || (outputHash ? '[name].[hash].js' : '[name].js');

  const viteConfig: InlineConfig = {
    appType: hasHtmlEntry ? 'spa' : 'custom',
    base: '/',
    build: {
      cssCodeSplit: true,
      emptyOutDir: false,
      minify: options.mode === 'production',
      outDir: outputPath,
      rolldownOptions: {
        input: hasHtmlEntry ? htmlPath : entryPath,
        output: {
          assetFileNames: outputHash ? 'assets/[name].[hash][extname]' : 'assets/[name][extname]',
          chunkFileNames: outputHash ? '[name].[hash].chunk.js' : '[name].chunk.js',
          entryFileNames: fileName,
          manualChunks(id) {
            return id.includes('/node_modules/') ? 'vendors' : undefined;
          }
        }
      },
      sourcemap: config.swc?.sourceMaps ? true : false,
      ssr: options.ssr ? entryPath : false,
      target: config.swc?.jsc?.target?.toString() || 'es2020'
    },
    clearScreen: false,
    configFile: false,
    css: {
      postcss: resolve(LexConfig.getLexDir(), 'postcss.config.js')
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(options.mode || (options.command === 'build' ? 'production' : 'development'))
    },
    envDir: process.cwd(),
    logLevel: options.quiet ? 'silent' : 'info',
    mode: options.mode || (options.command === 'build' ? 'production' : 'development'),
    plugins: [
      ...(options.ssr ? [] : [
        emptyCryptoPlugin(),
        nodePolyfills({
          globals: {Buffer: false, global: false, process: false},
          include: ['assert', 'buffer', 'http', 'https', 'os', 'path', 'process', 'stream', 'util', 'vm'],
          overrides: {
            buffer: resolveProjectPackage('buffer'),
            process: resolveProjectPackage('process/browser.js')
          },
          protocolImports: true
        }),
        createInjectPlugin({
          Buffer: [resolve(LexConfig.getLexDir(), 'node_modules/vite-plugin-node-polyfills/shims/buffer/dist/index.js'), 'Buffer'],
          global: [resolve(LexConfig.getLexDir(), 'node_modules/vite-plugin-node-polyfills/shims/global/dist/index.js'), 'default'],
          process: [resolve(LexConfig.getLexDir(), 'node_modules/vite-plugin-node-polyfills/shims/process/dist/index.js'), 'default']
        })
      ]),
      swcPlugin(sourcePath),
      graphqlPlugin(),
      ...(options.ssr ? [] : [importMetaCompatibilityPlugin(sourcePath), assetsDevPlugin(), analyzerPlugin(Boolean(options.analyze))])
    ],
    publicDir: false,
    resolve: {
      alias: {
        Buffer: resolveProjectPackage('buffer'),
        'core-js': resolveProjectPackage('core-js'),
        global: resolveProjectPackage('global'),
        'graphql-tag': resolveProjectPackage('graphql-tag'),
        randombytes: resolve(LexConfig.getLexDir(), 'node_modules/randombytes'),
        react: resolveProjectPackage('react'),
        'react-dom': resolveProjectPackage('react-dom'),
        'regenerator-runtime': resolveProjectPackage('regenerator-runtime'),
        'vite-plugin-node-polyfills/shims/buffer': resolve(LexConfig.getLexDir(), 'node_modules/vite-plugin-node-polyfills/shims/buffer/dist/index.js'),
        'vite-plugin-node-polyfills/shims/global': resolve(LexConfig.getLexDir(), 'node_modules/vite-plugin-node-polyfills/shims/global/dist/index.js'),
        'vite-plugin-node-polyfills/shims/process': resolve(LexConfig.getLexDir(), 'node_modules/vite-plugin-node-polyfills/shims/process/dist/index.js')
      },
      extensions: ['.mjs', '.js', '.ts', '.tsx', '.jsx', '.json', '.gql', '.graphql'],
      preserveSymlinks: false,
      tsconfigPaths: true
    },
    root: sourcePath,
    server: {
      hmr: false,
      open: options.open,
      port: options.port,
      strictPort: true
    }
  };

  if(!hasHtmlEntry && config.libraryName && !options.ssr) {
    viteConfig.build = {
      ...viteConfig.build,
      lib: {
        entry: entryPath,
        fileName: () => config.outputFile || 'index.js',
        formats: getLibraryFormats(config.libraryTarget),
        name: config.libraryName
      }
    };
  }

  return mergeConfig(viteConfig, config.vite || {}) as InlineConfig;
};
