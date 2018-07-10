import {transform as babelTransform, util as babelUtil} from 'babel-core';
import babelIstanbulPlugin from 'babel-plugin-istanbul';
import jestPreset from 'babel-preset-jest';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const THIS_FILE = fs.readFileSync(__filename);

const jestPreprocessor = (options: any) => {
  const updatedOptions = Object.assign({}, options, {
    compact: false,
    plugins: (options && options.plugins) || [],
    presets: ((options && options.presets) || []).concat([jestPreset]),
    sourceMaps: 'both'
  });
  delete updatedOptions.cacheDirectory;
  delete updatedOptions.filename;

  return {
    canInstrument: true,
    getCacheKey(fileData, filename, configString, {instrument, rootDir}): string {
      const babelConfig = JSON.stringify(options, null, 0);

      return crypto
        .createHash('md5')
        .update(THIS_FILE)
        .update('\0', 'utf8')
        .update(fileData)
        .update('\0', 'utf8')
        .update(path.relative(rootDir, filename))
        .update('\0', 'utf8')
        .update(configString)
        .update('\0', 'utf8')
        .update(babelConfig)
        .update('\0', 'utf8')
        .update(instrument ? 'instrument' : '')
        .digest('hex');
    },
    process(src, filename, config, transformOptions) {
      const altExts = config.moduleFileExtensions.map(
        (extension) => `.${extension}`,
      );
      if(babelUtil && !babelUtil.canCompile(filename, altExts)) {
        return src;
      }

      const theseOptions = Object.assign({filename}, updatedOptions);

      if(transformOptions && transformOptions.instrument) {
        theseOptions.auxiliaryCommentBefore = ' istanbul ignore next ';
        // Copied from jest-runtime transform.js
        theseOptions.plugins = theseOptions.plugins.concat([
          [
            babelIstanbulPlugin,
            {
              // files outside `cwd` will not be instrumented
              cwd: config.rootDir,
              exclude: []
            }
          ]
        ]);
      }

      // babel v7 might return null in the case when the file has been ignored.
      const transformResult = babelTransform(src, theseOptions);
      return transformResult || src;
    }
  };
};

module.exports = {jestPreprocessor};
