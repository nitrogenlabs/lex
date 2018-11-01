/**
 * Copyright (c) 2018, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import crypto, {Hash} from 'crypto';
import fs from 'fs';
import path from 'path';

import {FaviconsPluginCache, FaviconsPluginOptions} from '../types/main';

/**
 * @file this file is responsible for the persitance disk caching
 * it offers helpers to prevent recompilation of the favicons on
 * every build
 */
const {version: pluginVersion} = require('../../package.json');

/**
 * Generates a md5 hash for the given options
 */
export const generateHashForOptions = (options: FaviconsPluginOptions): string => {
  const hash: Hash = crypto.createHash('md5');
  hash.update(JSON.stringify(options));
  return hash.digest('hex');
};

/**
 * Stores the given iconResult together with the control hashes as JSON file
 */
export const emitCacheInformationFile = (
  loader,
  options: FaviconsPluginOptions,
  cacheFile: string,
  fileHash: string,
  iconResult: any
) => {
  if(!options.persistentCache) {
    return;
  }

  loader.emitFile(cacheFile, JSON.stringify({
    hash: fileHash,
    optionHash: generateHashForOptions(options),
    result: iconResult,
    version: pluginVersion
  }));
};

/**
 * Checks if the given cache object is still valid
 */
export const isCacheValid = (
  cache: FaviconsPluginCache,
  fileHash: string,
  options: FaviconsPluginOptions
): boolean => {
  const {hash, optionHash, version} = cache;
  // Verify that the source file is the same
  return hash === fileHash &&
    // Verify that the options are the same
    optionHash === generateHashForOptions(options) &&
    // Verify that the favicons version of the cache matches this version
    version === pluginVersion;
};

/**
 * Try to load the file from the disc cache
 */
export const loadIconsFromDiskCache = (
  loader,
  options: FaviconsPluginOptions,
  cacheFile: string,
  fileHash: string,
  callback
): void => {
  // Stop if cache is disabled
  if(!options.persistentCache) {
    return callback(null);
  }

  const {_compiler: loaderCompiler} = loader;
  const resolvedCacheFile: string = path.resolve(loaderCompiler.parentCompilation.compiler.outputPath, cacheFile);
  console.log('resolvedCacheFile', resolvedCacheFile);
  const exists: boolean = fs.existsSync(resolvedCacheFile);
  console.log('exists', exists);

  if(!exists) {
    return callback(null);
  }

  try {
    // const content: Buffer = fs.readFileSync(resolvedCacheFile);
    // const cache: FaviconsPluginCache = JSON.parse(content.toString());

    // // Bail out if the file or the option changed
    // if(!isCacheValid(cache, fileHash, options)) {
    //   return callback(null);
    // }

    console.log('callback::true');
    // return callback(null, cache.result);
    return callback(true);
  } catch(readError) {
    console.log('callback::readError');
    return callback(readError);
  }
};
