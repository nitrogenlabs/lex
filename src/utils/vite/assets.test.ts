import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'fs';
import {tmpdir} from 'os';
import {join} from 'path';
import sharp from 'sharp';

import type {LexConfigType} from '../../LexConfig.js';
import {
  compressLexWebAssets,
  copyLexWebAssets,
  generateLexFavicons,
  getAssetRelativePath,
  getDevAsset,
  optimizeLexWebAssets
} from './assets.js';

describe('Vite asset pipeline', () => {
  const directory = join(tmpdir(), 'lex-vite-assets-test');
  const sourcePath = join(directory, 'src');
  const outputPath = join(directory, 'dist');
  const config: LexConfigType = {
    outputFullPath: outputPath,
    sourceFullPath: sourcePath,
    vite: {staticPath: join(sourcePath, 'static')}
  };

  beforeEach(() => {
    mkdirSync(join(sourcePath, 'static'), {recursive: true});
    mkdirSync(join(sourcePath, 'images'), {recursive: true});
    mkdirSync(join(sourcePath, 'fonts'), {recursive: true});
    mkdirSync(join(sourcePath, 'docs'), {recursive: true});
    mkdirSync(join(sourcePath, 'icons'), {recursive: true});
    mkdirSync(outputPath, {recursive: true});
  });
  afterEach(() => rmSync(directory, {force: true, recursive: true}));

  it('copies conventional assets and builds the SVG sprite', async () => {
    writeFileSync(join(sourcePath, 'static/robots.txt'), 'allow');
    writeFileSync(join(sourcePath, 'fonts/font.woff'), 'font');
    writeFileSync(join(sourcePath, 'docs/readme.txt'), 'docs');
    writeFileSync(join(sourcePath, 'icons/check.svg'), '<svg viewBox="0 0 1 1"><path d="M0 0h1v1z"/></svg>');
    writeFileSync(join(sourcePath, 'icons/icon.png'), 'png');
    writeFileSync(join(outputPath, 'index.html'), '<html><head></head><body></body></html>');
    await sharp({create: {background: '#0000ff', channels: 4, height: 64, width: 64}})
      .png()
      .toFile(join(sourcePath, 'images/logo.png'));

    await copyLexWebAssets(config);

    expect(readFileSync(join(outputPath, 'robots.txt'), 'utf8')).toBe('allow');
    expect(existsSync(join(outputPath, 'fonts/font.woff'))).toBe(true);
    expect(existsSync(join(outputPath, 'docs/readme.txt'))).toBe(true);
    expect(existsSync(join(outputPath, 'icons/icon.png'))).toBe(true);
    expect(readFileSync(join(outputPath, 'icons/icons.svg'), 'utf8')).toContain('<symbol');
    expect(existsSync(join(outputPath, 'favicon.ico'))).toBe(true);
    expect(readFileSync(join(outputPath, 'index.html'), 'utf8')).toContain('apple-touch-icon');
  });

  it('optimizes images and creates gzip sidecars', async () => {
    const imagePath = join(outputPath, 'image.png');
    await sharp({create: {background: '#00ff00', channels: 4, height: 128, width: 128}})
      .png({compressionLevel: 0})
      .toFile(imagePath);
    const originalSize = readFileSync(imagePath).length;
    writeFileSync(join(outputPath, 'icon.svg'), '<svg viewBox="0 0 1 1"><path d="M0 0h1v1z"/></svg>');
    writeFileSync(join(outputPath, 'large.js'), 'const value = 1;'.repeat(1000));

    await optimizeLexWebAssets(config);
    compressLexWebAssets(config);

    expect(readFileSync(imagePath).length).toBeLessThan(originalSize);
    expect(existsSync(join(outputPath, 'large.js.gz'))).toBe(true);
    expect(getAssetRelativePath(config, imagePath)).toBe('image.png');
  });

  it('serves source assets and blocks traversal', async () => {
    writeFileSync(join(sourcePath, 'static/file.txt'), 'asset');
    writeFileSync(join(sourcePath, 'icons/check.svg'), '<svg viewBox="0 0 1 1"><path d="M0 0h1v1z"/></svg>');
    expect((await getDevAsset(config, '/file.txt'))?.toString()).toBe('asset');
    expect((await getDevAsset(config, '/icons/icons.svg'))?.toString()).toContain('<symbol');
    expect(await getDevAsset(config, '/../package.json')).toBeNull();
    expect(await getDevAsset(config, '/missing.txt')).toBeNull();
  });

  it('generates favicon assets when a logo is present', async () => {
    expect(await generateLexFavicons(config)).toBeNull();
    await sharp({create: {background: '#0000ff', channels: 4, height: 64, width: 64}})
      .png()
      .toFile(join(sourcePath, 'images/logo.png'));
    const generated = await generateLexFavicons(config);

    expect(generated?.images.some(({name}) => name === 'favicon.ico')).toBe(true);
    expect(generated?.images.some(({name}) => name === 'open-graph.png')).toBe(true);
    expect(generated?.images.some(({name}) => name === 'twitter.png')).toBe(true);
    expect(generated?.html).toContain('<meta property="og:image" content="/open-graph.png">');
    expect(await generateLexFavicons(config)).toBe(generated);
  });

  it('ignores missing output directories', async () => {
    const missingConfig = {outputFullPath: join(directory, 'missing')};
    await expect(optimizeLexWebAssets(missingConfig)).resolves.toBeUndefined();
    expect(compressLexWebAssets(missingConfig)).toBeUndefined();
  });
});
