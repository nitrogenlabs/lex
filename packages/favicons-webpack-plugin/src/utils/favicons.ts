/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {favicons} from 'favicons';
import loaderUtils from 'loader-utils';

import {emitCacheInformationFile, loadIconsFromDiskCache} from './cache.js';

import type {FaviconsPluginOptions} from '../types/main.ts';
import type {FaviconOptions} from 'favicons';
import type {LoaderContext as WebpackLoaderContext, Compilation, Compiler} from 'webpack';

interface LoaderContext extends WebpackLoaderContext<Buffer> {
  _compilation: Compilation;
  _compiler: Compiler;
  rootContext: string;
}

interface LoaderQuery {
  appName?: string;
  background?: string;
  context?: string;
  icons?: FaviconOptions['icons'];
  outputFilePrefix?: string;
  regExp?: RegExp;
}

interface GenerateIconsCallback {
  (error: Error | null, result?: {
    files: string[];
    html: string[];
    outputFilePrefix: string;
    images?: unknown[];  // Make images optional since we don't use it in the cache
  }): void;
}

const getPublicPath = (compilation: Compilation): string => {
  let publicPath: string = (compilation.outputOptions.publicPath as string) || '';

  if(publicPath.length && publicPath.substr(-1) !== '/') {
    publicPath += '/';
  }

  return publicPath;
};

const generateIcons = (
  loader: LoaderContext,
  imageFileStream: Buffer,
  pathPrefix: string,
  query: LoaderQuery,
  callback: GenerateIconsCallback
) => {
  const {_compilation: loaderCompilation} = loader;
  const publicPath: string = getPublicPath(loaderCompilation);
  const {appName, background, icons} = query;

  favicons(imageFileStream, {
    appName,
    background,
    icons,
    path: '',
    start_url: ''
  })
    .then(({html, images, files}) => {
      const htmlFiles = html
        .filter((entry) => entry.indexOf('manifest') === -1)
        .map((entry) => entry.replace(/(href=[""])/g, `$1${publicPath}${pathPrefix}`));
      const loaderResult = {files: [] as string[], html: htmlFiles, outputFilePrefix: pathPrefix};

      images.forEach((image) => {
        loaderResult.files.push(`${pathPrefix}${image.name}`);
        loader.emitFile(pathPrefix + image.name, image.contents);
      });

      files.forEach((file) => {
        loaderResult.files.push(`${pathPrefix}${file.name}`);
        loader.emitFile(pathPrefix + file.name, file.contents);
      });

      return callback(null, loaderResult);
    })
    .catch((faviconError) => callback(faviconError));
};

module.exports = (loaderContext, content: Buffer) => {
  loaderContext?.cacheable();

  if(!loaderContext.emitFile) {
    throw new Error('FaviconsPlugin Error: emitFile is required from module system');
  }

  if(!loaderContext.async) {
    throw new Error('FaviconsPlugin Error: async is required');
  }

  const callback = loaderContext.async();
  const query = loaderUtils.parseQuery(loaderContext.query as string) as LoaderQuery;
  const {context = loaderContext.rootContext, outputFilePrefix, regExp} = query;
  const pathPrefix = loaderUtils.interpolateName(loaderContext, outputFilePrefix, {content, context, regExp});
  const fileHash = loaderUtils.interpolateName(loaderContext, '[hash]', {content, context, regExp});
  const cacheFile = `${pathPrefix}.cache`;

  loadIconsFromDiskCache(loaderContext, query as FaviconsPluginOptions, cacheFile, fileHash, (loadError: Error, cachedResult) => {
    if(loadError) {
      callback(loadError);
    } else if(cachedResult) {
      callback(null, `module.exports = ${JSON.stringify(cachedResult)}`);
    } else {
      // Generate icons
      generateIcons(loaderContext, content, pathPrefix, query, (generateError: Error, iconResult) => {
        if(generateError) {
          callback(generateError);
          return null;
        }

        emitCacheInformationFile(loaderContext, query as FaviconsPluginOptions, cacheFile, fileHash, iconResult);
        callback(null, `module.exports = ${JSON.stringify(iconResult)}`);
        return null;
      });
    }
  });
};

module.exports.raw = true;
