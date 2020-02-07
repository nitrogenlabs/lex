import path from 'path';

import {resolveConfig} from '../config/resolveConfig';
import {options} from '../main/options';
import {createIgnorer} from './createIgnorer';

const getfileInfoInternal = ({ignorer, filePath, plugins, resolve = false, sync = false}) => {
  const fileInfo = {
    ignored: ignorer.ignores(filePath),
    inferredParser: options.inferParser(filePath, plugins) || null
  };

  if(!fileInfo.inferredParser && resolve) {
    if(!sync) {
      return resolveConfig(filePath).then((resolvedConfig) => {
        if(resolvedConfig && resolvedConfig.parser) {
          fileInfo.inferredParser = resolvedConfig.parser;
        }

        return fileInfo;
      });
    }

    const resolvedConfig = resolveConfig.sync(filePath);
    if(resolvedConfig && resolvedConfig.parser) {
      fileInfo.inferredParser = resolvedConfig.parser;
    }
  }

  return fileInfo;
};

const normalizeFilePath = (filePath, ignorePath) => (
  ignorePath
    ? path.relative(path.dirname(ignorePath), filePath)
    : filePath
);

/**
 * @typedef {{ ignorePath?: string, withNodeModules?: boolean, plugins: object }} FileInfoOptions
 * @typedef {{ ignored: boolean, inferredParser: string | null }} FileInfoResult
 */

/**
 * @param {string} filePath
 * @param {FileInfoOptions} opts
 * @returns {Promise<FileInfoResult>}
 *
 * Please note that prettier.getFileInfo() expects opts.plugins to be an array of paths,
 * not an object. A transformation from this array to an object is automatically done
 * internally by the method wrapper. See withPlugins() in index.js.
 */
export const getFileInfo = (filePath, opts) => {
  if(typeof filePath !== 'string') {
    return Promise.reject(
      new TypeError(
        `expect \`filePath\` to be a string, got \`${typeof filePath}\``
      )
    );
  }

  return createIgnorer(opts.ignorePath, opts.withNodeModules).then((ignorer) =>
    getfileInfoInternal({
      ignorer,
      filePath: normalizeFilePath(filePath, opts.ignorePath),
      plugins: opts.plugins,
      resolve: opts.resolveConfig,
      sync: false
    })
  );
};

/**
 * @param {string} filePath
 * @param {FileInfoOptions} opts
 * @returns {FileInfoResult}
 */
getFileInfo.sync = function(filePath, opts) {
  if(typeof filePath !== 'string') {
    throw new TypeError(
      `expect \`filePath\` to be a string, got \`${typeof filePath}\``
    );
  }

  const ignorer = createIgnorer.sync(opts.ignorePath, opts.withNodeModules);
  return getfileInfoInternal({
    ignorer,
    filePath: normalizeFilePath(filePath, opts.ignorePath),
    plugins: opts.plugins,
    resolve: opts.resolveConfig,
    sync: true
  });
};
