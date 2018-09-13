import generateFavicons from 'favicons';
import loaderUtils from 'loader-utils';
import webpack from 'webpack';

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

  generateFavicons(imageFileStream, {
    appName,
    background,
    icons,
    path: '',
    start_url: ''
  }, (error, result) => {
    if(error) {
      return callback(error);
    }

    const html = result.html
      .filter((entry) => entry.indexOf('manifest') === -1)
      .map((entry) => entry.replace(/(href=[""])/g, `$1${publicPath}${pathPrefix}`));
    const loaderResult = {files: [], html, outputFilePrefix: pathPrefix};

    result.images.forEach((image) => {
      loaderResult.files.push(pathPrefix + image.name);
      loader.emitFile(pathPrefix + image.name, image.contents);
    });

    result.files.forEach((file) => {
      loaderResult.files.push(pathPrefix + file.name);
      loader.emitFile(pathPrefix + file.name, file.contents);
    });

    return callback(null, loaderResult);
  });
};

module.exports = function(this: webpack.loader.LoaderContext, content) {
  this.cacheable && this.cacheable();

  if(!this.emitFile) {
    throw new Error('FaviconsPlugin Error: emitFile is required from module system');
  }

  if(!this.async) {
    throw new Error('FaviconsPlugin Error: async is required');
  }

  const callback = this.async();
  const query = loaderUtils.parseQuery(this.query);
  const {context = this.rootContext, outputFilePrefix, regExp} = query;
  const pathPrefix = loaderUtils.interpolateName(this, outputFilePrefix, {content, context, regExp});
  const fileHash = loaderUtils.interpolateName(this, '[hash]', {content, context, regExp});
  const cacheFile = `${pathPrefix}.cache`;

  loadIconsFromDiskCache(this, query, cacheFile, fileHash, (loadError: Error, cachedResult) => {
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

        emitCacheInformationFile(this, query, cacheFile, fileHash, iconResult);
        callback(null, `module.exports = ${JSON.stringify(iconResult)}`);
        return null;
      });
    }
  });
};

module.exports.raw = true;
