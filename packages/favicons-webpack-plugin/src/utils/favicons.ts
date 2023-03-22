/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {favicons} from 'favicons';
import loaderUtils from 'loader-utils';

import {emitCacheInformationFile, loadIconsFromDiskCache} from './cache';

const getPublicPath = (compilation): string => {
  let publicPath: string = compilation.outputOptions.publicPath || '';

  if(publicPath.length && publicPath.substr(-1) !== '/') {
    publicPath += '/';
  }

  return publicPath;
};

const generateIcons = (loader, imageFileStream, pathPrefix, query, callback) => {
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

module.exports = (loaderContext: any, content) => {
  loaderContext?.cacheable();

  if(!loaderContext.emitFile) {
    throw new Error('FaviconsPlugin Error: emitFile is required from module system');
  }

  if(!loaderContext.async) {
    throw new Error('FaviconsPlugin Error: async is required');
  }

  const callback = loaderContext.async();
  const query: any = loaderUtils.parseQuery(loaderContext.query);
  const {context = loaderContext.rootContext, outputFilePrefix, regExp} = query;
  const pathPrefix = loaderUtils.interpolateName(loaderContext, outputFilePrefix, {content, context, regExp});
  const fileHash = loaderUtils.interpolateName(loaderContext, '[hash]', {content, context, regExp});
  const cacheFile = `${pathPrefix}.cache`;

  loadIconsFromDiskCache(loaderContext, query, cacheFile, fileHash, (loadError: Error, cachedResult) => {
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

        emitCacheInformationFile(loaderContext, query, cacheFile, fileHash, iconResult);
        callback(null, `module.exports = ${JSON.stringify(iconResult)}`);
        return null;
      });
    }
  });
};

module.exports.raw = true;
