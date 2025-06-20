/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {favicons} from 'favicons';
import loaderUtils from 'loader-utils';
import path from 'path';

import {emitCacheInformationFile, loadIconsFromDiskCache} from './cache.js';

import type {FaviconsPluginOptions} from '../types/main.js';
import type {FaviconOptions, FaviconResponse} from 'favicons';
import type {LoaderContext as WebpackLoaderContext, Compilation, Compiler} from 'webpack';

// Extended loader context that matches what webpack and loader-utils expect
interface LoaderContext extends WebpackLoaderContext<Buffer> {
  _compilation: Compilation;
  _compiler: Compiler & {
    parentCompilation?: {
      compiler: {
        outputPath: string;
      };
    };
  };
  rootContext: string;
}

// Interface for the webpack loader
interface WebpackLoader {
  emitFile: (file: string, content: string) => void;
  _compiler: {
    parentCompilation: {
      compiler: {
        outputPath: string;
      };
    };
  };
}

interface LoaderQuery {
  appName?: string;
  background?: string;
  context?: string;
  icons?: FaviconOptions['icons'];
  outputFilePrefix?: string;
  regExp?: RegExp;
}

export interface IconResult {
  files: string[];
  html: string[];
  outputFilePrefix: string;
  images?: unknown[];  // Make images optional since we don't use it in the cache
}

interface GenerateIconsCallback {
  (error: Error | null, result?: IconResult): void;
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
    .then(({html, images, files}: FaviconResponse) => {
      const htmlFiles = html
        .filter((entry) => entry.indexOf('manifest') === -1)
        .map((entry) => entry.replace(/(href=[""])/g, `$1${publicPath}${pathPrefix}`));
      const loaderResult: IconResult = {files: [] as string[], html: htmlFiles, outputFilePrefix: pathPrefix};

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

// Create a compatible loader context for cache functions
const createWebpackLoader = (loaderContext: LoaderContext): WebpackLoader => ({
  emitFile: loaderContext.emitFile.bind(loaderContext),
  _compiler: {
    parentCompilation: {
      compiler: {
        outputPath: path.dirname(loaderContext.resourcePath)
      }
    }
  }
});

module.exports = function(this: LoaderContext, content: Buffer) {
  this?.cacheable();

  if(!this.emitFile) {
    throw new Error('FaviconsPlugin Error: emitFile is required from module system');
  }

  if(!this.async) {
    throw new Error('FaviconsPlugin Error: async is required');
  }

  const callback = this.async();
  const query = loaderUtils.parseQuery(this.query as string) as LoaderQuery;
  const {context = this.rootContext, outputFilePrefix, regExp} = query;
  const pathPrefix = loaderUtils.interpolateName(this as any, outputFilePrefix, {content, context, regExp});
  const fileHash = loaderUtils.interpolateName(this as any, '[hash]', {content, context, regExp});
  const cacheFile = `${pathPrefix}.cache`;
  const webpackLoader = createWebpackLoader(this);

  loadIconsFromDiskCache(webpackLoader, query as FaviconsPluginOptions, cacheFile, fileHash, (loadError: Error, cachedResult) => {
    if(loadError) {
      callback(loadError);
    } else if(cachedResult) {
      callback(null, `module.exports = ${JSON.stringify(cachedResult)}`);
    } else {
      // Generate icons
      generateIcons(this, content, pathPrefix, query, (generateError: Error, iconResult) => {
        if(generateError) {
          callback(generateError);
          return null;
        }

        emitCacheInformationFile(webpackLoader, query as FaviconsPluginOptions, cacheFile, fileHash, iconResult);
        callback(null, `module.exports = ${JSON.stringify(iconResult)}`);
        return null;
      });
    }
  });
};

module.exports.raw = true;
