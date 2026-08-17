/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {gzipSync} from 'zlib';
import favicons from 'favicons';
import {existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync} from 'fs';
import {sync as globSync} from 'glob';
import {extname, join, relative, resolve} from 'path';
import sharp from 'sharp';
import {optimize} from 'svgo';

import type {LexConfigType} from '../../LexConfig.js';
import {LexSvgSpritemap} from '../assets/LexSvgSpritemap.js';

const COMPRESSIBLE_FILE = /\.(css|html|js|json|svg|txt|xml)$/i;
const IMAGE_FILE = /\.(gif|jpe?g|png|svg|webp)$/i;
const MINIMUM_GZIP_SIZE = 8192;

interface GeneratedFavicons {
  readonly files: ReadonlyArray<{contents: string; name: string}>;
  readonly html: string[];
  readonly images: ReadonlyArray<{contents: Buffer; name: string}>;
}

const faviconCache = new Map<string, {modifiedAt: number; response: GeneratedFavicons}>();

const copyDirectory = (source: string, destination: string, exclude?: RegExp): void => {
  if(!existsSync(source)) return;

  for(const entry of readdirSync(source, {withFileTypes: true})) {
    const sourcePath = join(source, entry.name);
    const destinationPath = join(destination, entry.name);

    if(exclude?.test(sourcePath)) continue;

    if(entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath, exclude);
    } else {
      mkdirSync(resolve(destinationPath, '..'), {recursive: true});
      writeFileSync(destinationPath, readFileSync(sourcePath));
    }
  }
};

const getAssetDirectories = (config: LexConfigType): Array<{destination: string; exclude?: RegExp; source: string}> => {
  const sourcePath = config.sourceFullPath || resolve(process.cwd(), config.sourcePath || './src');
  const staticPath = config.vite?.staticPath || './src/static';

  return [
    {destination: '', source: resolve(process.cwd(), staticPath)},
    {destination: 'images', source: resolve(sourcePath, 'images')},
    {destination: 'fonts', source: resolve(sourcePath, 'fonts')},
    {destination: 'docs', source: resolve(sourcePath, 'docs')},
    {destination: 'icons', exclude: /\.svg$/i, source: resolve(sourcePath, 'icons')}
  ];
};

export const generateLexFavicons = async (config: LexConfigType): Promise<GeneratedFavicons | null> => {
  const sourcePath = config.sourceFullPath || resolve(process.cwd(), config.sourcePath || './src');
  const logoPath = resolve(sourcePath, 'images/logo.png');

  if(!existsSync(logoPath)) return null;

  const modifiedAt = statSync(logoPath).mtimeMs;
  const cached = faviconCache.get(logoPath);
  if(cached?.modifiedAt === modifiedAt) return cached.response;

  const generated = await favicons(logoPath, {
    icons: {
      android: true,
      appleIcon: true,
      appleStartup: false,
      favicons: true,
      windows: false,
      yandex: false
    },
    path: '/'
  });
  const [openGraphImage, twitterImage] = await Promise.all([
    sharp(logoPath).resize(1200, 630, {fit: 'contain'}).png().toBuffer(),
    sharp(logoPath).resize(1200, 675, {fit: 'contain'}).png().toBuffer()
  ]);
  const response: GeneratedFavicons = {
    ...generated,
    html: [
      ...generated.html,
      '<meta property="og:image" content="/open-graph.png">',
      '<meta name="twitter:image" content="/twitter.png">'
    ],
    images: [
      ...generated.images,
      {contents: openGraphImage, name: 'open-graph.png'},
      {contents: twitterImage, name: 'twitter.png'}
    ]
  };
  faviconCache.set(logoPath, {modifiedAt, response});
  return response;
};

export const copyLexWebAssets = async (config: LexConfigType): Promise<void> => {
  const outputPath = config.outputFullPath || resolve(process.cwd(), config.outputPath || './lib');

  for(const assetDirectory of getAssetDirectories(config)) {
    copyDirectory(assetDirectory.source, resolve(outputPath, assetDirectory.destination), assetDirectory.exclude);
  }

  const sourcePath = config.sourceFullPath || resolve(process.cwd(), config.sourcePath || './src');
  const spritemap = new LexSvgSpritemap(resolve(sourcePath, 'icons/**/*.svg'), {
    filename: 'icons/icons.svg',
    prefix: false
  }).buildSpritemap();

  for(const warning of spritemap.warnings) console.warn(warning.message);

  if(spritemap.content) {
    const spritePath = resolve(outputPath, 'icons/icons.svg');
    mkdirSync(resolve(spritePath, '..'), {recursive: true});
    writeFileSync(spritePath, spritemap.content);
  }

  const generatedFavicons = await generateLexFavicons(config);
  if(generatedFavicons) {
    for(const image of generatedFavicons.images) {
      const imagePath = resolve(outputPath, image.name);
      mkdirSync(resolve(imagePath, '..'), {recursive: true});
      writeFileSync(imagePath, image.contents);
    }
    for(const file of generatedFavicons.files) {
      const filePath = resolve(outputPath, file.name);
      mkdirSync(resolve(filePath, '..'), {recursive: true});
      writeFileSync(filePath, file.contents);
    }

    const indexPath = resolve(outputPath, 'index.html');
    if(existsSync(indexPath)) {
      const html = readFileSync(indexPath, 'utf8');
      const faviconHtml = generatedFavicons.html.join('\n    ');
      writeFileSync(indexPath, html.replace('</head>', `    ${faviconHtml}\n  </head>`));
    }
  }
};

const optimizeImage = async (filePath: string): Promise<void> => {
  const extension = extname(filePath).toLowerCase();
  const source = readFileSync(filePath);

  if(extension === '.svg') {
    const isSpritemap = filePath.endsWith('/icons/icons.svg');
    const result = optimize(source.toString(), {
      multipass: true,
      path: filePath,
      plugins: isSpritemap
        ? [{name: 'preset-default', params: {overrides: {cleanupIds: false, removeHiddenElems: false}}}]
        : ['preset-default']
    });
    writeFileSync(filePath, result.data);
    return;
  }

  let image = sharp(source);
  if(extension === '.jpg' || extension === '.jpeg') image = image.jpeg({progressive: true, quality: 65});
  if(extension === '.png') image = image.png({quality: 90});
  if(extension === '.webp') image = image.webp({quality: 75});
  if(extension === '.gif') image = image.gif();

  const optimized = await image.toBuffer();
  if(optimized.length < source.length) writeFileSync(filePath, optimized);
};

export const optimizeLexWebAssets = async (config: LexConfigType): Promise<void> => {
  const outputPath = config.outputFullPath || resolve(process.cwd(), config.outputPath || './lib');
  if(!existsSync(outputPath)) return;

  const imageFiles = globSync('**/*.{gif,jpg,jpeg,png,svg,webp}', {
    absolute: true,
    cwd: outputPath,
    nodir: true
  });

  await Promise.all(imageFiles.filter((filePath) => IMAGE_FILE.test(filePath)).map(optimizeImage));
};

export const compressLexWebAssets = (config: LexConfigType): void => {
  const outputPath = config.outputFullPath || resolve(process.cwd(), config.outputPath || './lib');
  if(!existsSync(outputPath)) return;

  const files = globSync('**/*', {absolute: true, cwd: outputPath, nodir: true});
  for(const filePath of files) {
    if(!COMPRESSIBLE_FILE.test(filePath) || statSync(filePath).size < MINIMUM_GZIP_SIZE) continue;
    writeFileSync(`${filePath}.gz`, gzipSync(readFileSync(filePath)));
  }
};

export const getDevAsset = async (config: LexConfigType, requestPath: string): Promise<Buffer | null> => {
  const normalizedPath = requestPath.split('?')[0].replace(/^\/+/, '');
  if(normalizedPath.includes('..')) return null;

  if(normalizedPath === 'icons/icons.svg') {
    const sourcePath = config.sourceFullPath || resolve(process.cwd(), config.sourcePath || './src');
    const spritemap = new LexSvgSpritemap(resolve(sourcePath, 'icons/**/*.svg'), {prefix: false}).buildSpritemap();
    return spritemap.content ? Buffer.from(spritemap.content) : null;
  }

  const generatedFavicons = await generateLexFavicons(config);
  const generatedImage = generatedFavicons?.images.find(({name}) => name === normalizedPath);
  if(generatedImage) return generatedImage.contents;
  const generatedFile = generatedFavicons?.files.find(({name}) => name === normalizedPath);
  if(generatedFile) return Buffer.from(generatedFile.contents);

  for(const assetDirectory of getAssetDirectories(config)) {
    const prefix = assetDirectory.destination ? `${assetDirectory.destination}/` : '';
    if(!normalizedPath.startsWith(prefix)) continue;

    const relativePath = normalizedPath.slice(prefix.length);
    const filePath = resolve(assetDirectory.source, relativePath);
    if(filePath.startsWith(resolve(assetDirectory.source)) && existsSync(filePath) && statSync(filePath).isFile()) {
      if(assetDirectory.exclude?.test(filePath)) continue;
      return readFileSync(filePath);
    }
  }

  return null;
};

export const getAssetRelativePath = (config: LexConfigType, filePath: string): string => {
  const outputPath = config.outputFullPath || resolve(process.cwd(), config.outputPath || './lib');
  return relative(outputPath, filePath);
};
