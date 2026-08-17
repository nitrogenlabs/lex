import {execa} from 'execa';
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'fs';
import {tmpdir} from 'os';
import {join, resolve} from 'path';
import sharp from 'sharp';

describe('Vite web build', () => {
  let testDirectory: string;

  let originalImageSize: number;

  beforeEach(async () => {
    testDirectory = join(tmpdir(), `lex-vite-${Date.now()}`);
    mkdirSync(join(testDirectory, 'src/icons'), {recursive: true});
    mkdirSync(join(testDirectory, 'src/images'), {recursive: true});
    mkdirSync(join(testDirectory, 'src/static'), {recursive: true});
    writeFileSync(join(testDirectory, 'package.json'), JSON.stringify({name: 'lex-vite-fixture', type: 'module'}));
    writeFileSync(join(testDirectory, 'src/index.html'), '<!doctype html><html><head></head><body><script type="module" src="/index.ts"></script></body></html>');
    writeFileSync(join(testDirectory, 'src/index.ts'), `
      import assert from 'assert';
      import http from 'http';
      import https from 'https';
      import os from 'os';
      import path from 'path';
      import process from 'process';
      import randombytes from 'randombytes';
      import {Readable} from 'stream';
      import util from 'util';
      import vm from 'vm';
      import './styles.css';
      import query from './query.graphql';
      globalThis.__lexBuffer = Buffer.from('vite').toString();
      globalThis.__lexPolyfills = {assert, global, http, https, os, path, process, randombytes, Readable, util, vm};
      globalThis.__lexQuery = query;
      import('./lazy.ts').then(({value}) => value);
    `);
    writeFileSync(join(testDirectory, 'src/lazy.ts'), 'export const value = "lazy";');
    writeFileSync(join(testDirectory, 'src/query.graphql'), 'query Viewer { viewer { id } }');
    writeFileSync(join(testDirectory, 'src/styles.css'), ':root { --color: red; } body { color: var(--color); }');
    writeFileSync(join(testDirectory, 'src/icons/check.svg'), '<svg viewBox="0 0 10 10"><path d="M0 5l3 3 7-7"/></svg>');
    writeFileSync(join(testDirectory, 'src/static/large.txt'), 'lex'.repeat(3000));
    const logoPath = join(testDirectory, 'src/images/logo.png');
    await sharp({create: {background: '#ff0000', channels: 4, height: 256, width: 256}})
      .png({compressionLevel: 0})
      .toFile(logoPath);
    originalImageSize = readFileSync(logoPath).length;
  });

  afterEach(() => rmSync(testDirectory, {force: true, recursive: true}));

  it('builds dynamic chunks, polyfills, GraphQL, sprites, static assets, and gzip output', async () => {
    const cliPath = resolve(process.cwd(), 'lib/lex.js');
    const result = await execa('node', [cliPath, 'build', '--bundler', 'vite', '--sourcePath', './src', '--outputPath', './dist', '--remove'], {
      cwd: testDirectory,
      reject: false,
      timeout: 30000
    });

    expect(result.exitCode, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(existsSync(join(testDirectory, 'dist/index.html'))).toBe(true);
    expect(existsSync(join(testDirectory, 'dist/icons/icons.svg'))).toBe(true);
    expect(existsSync(join(testDirectory, 'dist/large.txt.gz'))).toBe(true);
    expect(existsSync(join(testDirectory, 'dist/favicon.ico'))).toBe(true);
    expect(readFileSync(join(testDirectory, 'dist/images/logo.png')).length).toBeLessThan(originalImageSize);
    expect(readFileSync(join(testDirectory, 'dist/icons/icons.svg'), 'utf8')).toContain('<symbol');
    expect(existsSync(join(testDirectory, 'dist'))).toBe(true);
  }, 35000);

  it('renders and crawls a static site through Vite SSR loading', async () => {
    rmSync(join(testDirectory, 'src/index.html'));
    writeFileSync(join(testDirectory, 'src/index.ts'), `
      export default ({path}) => path === '/'
        ? '<!doctype html><html><body><a href="/about">About</a></body></html>'
        : '<!doctype html><html><body>About page</body></html>';
    `);

    const cliPath = resolve(process.cwd(), 'lib/lex.js');
    const result = await execa('node', [cliPath, 'build', '--bundler', 'vite', '--sourcePath', './src', '--outputPath', './dist', '--static', '--remove'], {
      cwd: testDirectory,
      reject: false,
      timeout: 30000
    });

    expect(result.exitCode, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(readFileSync(join(testDirectory, 'dist/index.html'), 'utf8')).toContain('/about');
    expect(readFileSync(join(testDirectory, 'dist/about/index.html'), 'utf8')).toContain('About page');
  }, 35000);
});
