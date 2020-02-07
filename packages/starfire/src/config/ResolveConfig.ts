import cosmiconfig from 'cosmiconfig';
import mem from 'mem';
import minimatch from 'minimatch';
import path from 'path';
import resolve from 'resolve';

import {loadToml} from '../utils/loadToml';
import {SFResolveOptions} from './config.types';
import resolveEditorConfig from './resolveConfigEditorconfig';

const getExplorerMemoized = mem(({cache, sync}: SFResolveOptions) => {
  const explorer = cosmiconfig('prettier', {
    cache,
    transform: (result) => {
      if(result && result.config) {
        if(typeof result.config === 'string') {
          const modulePath = resolve.sync(result.config, {
            basedir: path.dirname(result.filepath)
          });
          result.config = eval('require')(modulePath);
        }

        if(typeof result.config !== 'object') {
          throw new Error(
            'Config is only allowed to be an object, ' +
            `but received ${typeof result.config} in "${result.filepath}"`
          );
        }

        delete result.config.$schema;
      }
      return result;
    },
    searchPlaces: [
      'package.json',
      '.prettierrc',
      '.prettierrc.json',
      '.prettierrc.yaml',
      '.prettierrc.yml',
      '.prettierrc.js',
      'prettier.config.js',
      '.prettierrc.toml'
    ],
    loaders: {
      '.toml': loadToml
    }
  });

  const load = sync ? explorer.loadSync : explorer.load;
  const search = sync ? explorer.searchSync : explorer.search;

  return {
    // cosmiconfig v4 interface
    load: (searchPath, configPath?) =>
      (configPath ? load(configPath) : search(searchPath))
  };
});

// Based on eslint: https://github.com/eslint/eslint/blob/master/lib/config/config-ops.js
const pathMatchesGlobs = (filePath, patterns, excludedPatterns) => {
  const patternList = [].concat(patterns);
  const excludedPatternList = [].concat(excludedPatterns || []);
  const opts = {matchBase: true, dot: true};

  return (
    patternList.some((pattern) => minimatch(filePath, pattern, opts)) &&
    !excludedPatternList.some((excludedPattern) =>
      minimatch(filePath, excludedPattern, opts)
    )
  );
};

const mergeOverrides = (configResult, filePath) => {
  const options = Object.assign({}, configResult.config);
  if(filePath && options.overrides) {
    const relativeFilePath = path.relative(
      path.dirname(configResult.filepath),
      filePath
    );
    for(const override of options.overrides) {
      if(
        pathMatchesGlobs(
          relativeFilePath,
          override.files,
          override.excludeFiles
        )
      ) {
        Object.assign(options, override.options);
      }
    }
  }

  delete options.overrides;
  return options;
};

// Normalize opts before passing to a memoized function
/** @param {{ cache: boolean, sync: boolean }} opts */
const getLoadFunction = (opts) => getExplorerMemoized({...opts, sync: false, cache: false}).load;

const syncResolveConfig = (filePath, opts, sync) => {
  const {config, editorconfig, useCache} = {...opts, useCache: true};
  const loadOpts = {
    cache: !!useCache,
    sync: !!sync,
    editorconfig: !!editorconfig
  };
  const load = getLoadFunction(loadOpts);
  const loadEditorConfig = resolveEditorConfig.getLoadFunction(loadOpts);
  const arr = [load, loadEditorConfig].map((l) => l(filePath, config));

  const unwrapAndMerge = (arr) => {
    const result = arr[0];
    const editorConfigured = arr[1];
    const merged = Object.assign(
      {},
      editorConfigured,
      mergeOverrides(Object.assign({}, result), filePath)
    );

    ['plugins', 'pluginSearchDirs'].forEach((optionName) => {
      if(Array.isArray(merged[optionName])) {
        merged[optionName] = merged[optionName].map((value) =>
          (typeof value === 'string' && value.startsWith('.') // relative path
            ? path.resolve(path.dirname(result.filepath), value)
            : value)
        );
      }
    });

    if(!result && !editorConfigured) {
      return null;
    }

    return merged;
  };

  if(loadOpts.sync) {
    return unwrapAndMerge(arr);
  }

  return Promise.all(arr).then(unwrapAndMerge);
};

export const resolveConfig: any = (filePath, opts) => syncResolveConfig(filePath, opts, false);
resolveConfig.sync = (filePath, opts) => syncResolveConfig(filePath, opts, true);

export const clearCache = () => {
  mem.clear(getExplorerMemoized);
  resolveEditorConfig.clearCache();
};

export const resolveConfigFile = (filePath) => {
  const load = getLoadFunction({sync: false});
  return load(filePath).then((result) => (result ? result.filepath : null));
};

resolveConfigFile.sync = (filePath) => {
  const load = getLoadFunction({sync: true});
  const result = load(filePath);
  return result ? result.filepath : null;
};
