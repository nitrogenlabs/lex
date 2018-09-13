/**
 * @file this file is responsible for the persitance disk caching
 * it offers helpers to prevent recompilation of the favicons on
 * every build
 */
import crypto, {Hash} from 'crypto';
import fs from 'fs';
import path from 'path';

const {version: pluginVersion} = require('../../package.json');

/**
 * Generates a md5 hash for the given options
 */
const generateHashForOptions = (options) => {
  const hash: Hash = crypto.createHash('md5');
  hash.update(JSON.stringify(options));
  return hash.digest('hex');
};

/**
 * Stores the given iconResult together with the control hashes as JSON file
 */
export const emitCacheInformationFile = (loader, query, cacheFile, fileHash, iconResult) => {
  if(!query.persistentCache) {
    return;
  }

  loader.emitFile(cacheFile, JSON.stringify({
    hash: fileHash,
    optionHash: generateHashForOptions(query),
    result: iconResult,
    version: pluginVersion
  }));
};

/**
 * Checks if the given cache object is still valid
 */
const isCacheValid = (cache, fileHash, query) => {
  const {hash, optionHash, version} = cache;

  // Verify that the source file is the same
  return hash === fileHash &&
    // Verify that the options are the same
    optionHash === generateHashForOptions(query) &&
    // Verify that the favicons version of the cache matches this version
    version === pluginVersion;
};

/**
 * Try to load the file from the disc cache
 */
export const loadIconsFromDiskCache = (loader, query, cacheFile, fileHash, callback): void => {
  // Stop if cache is disabled
  if(!query.persistentCache) {
    return callback(null);
  }

  const {_compiler: loaderCompiler} = loader;
  const resolvedCacheFile: string = path.resolve(loaderCompiler.parentCompilation.compiler.outputPath, cacheFile);
  const exists = fs.existsSync(resolvedCacheFile);

  if(!exists) {
    return callback(null);
  }

  try {
    const content: Buffer = fs.readFileSync(resolvedCacheFile);
    const cache = JSON.parse(content.toString());

    // Bail out if the file or the option changed
    if(!isCacheValid(cache, fileHash, query)) {
      return callback(null);
    }

    return callback(null, cache.result);
  } catch(readError) {
    return callback(readError);
  }
};
