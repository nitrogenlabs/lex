import mem from 'mem';
import minimatch from 'minimatch';
import path from 'path';

import {ThirdParty} from '../common/ThirdParty';
import {ResolveEditorConfig} from './ResolveEditorConfig';

export class ResolveConfig {
  static get getExplorerMemoized() {
    return mem((opts) =>
      ThirdParty.cosmiconfig('starfire', {
        cache: opts.cache,
        rcExtensions: true,
        sync: opts.sync,
        transform: (result) => {
          if(result && result.config) {
            delete result.config.$schema;
          }
          return result;
        }
      })
    );
  }

  /** @param {{ cache: boolean, sync: boolean }} opts */
  static getLoadFunction(opts) {
    // Normalize opts before passing to a memoized function
    opts = {sync: false, cache: false, ...opts};
    return ResolveConfig.getExplorerMemoized(opts).load;
  }

  static resolveConfigPath(filePath, opts, sync) {
    opts = {useCache: true, ...opts};
    const loadOpts = {
      cache: !!opts.useCache,
      editorconfig: !!opts.editorconfig,
      sync: !!sync
    };
    const load = ResolveConfig.getLoadFunction(loadOpts);
    const loadEditorConfig = ResolveEditorConfig.getLoadFunction(loadOpts);
    const arr = [load, loadEditorConfig].map((l) => l(filePath, opts.config));

    const unwrapAndMerge = (mergeArr) => {
      const result = mergeArr[0];
      const editorConfigured = mergeArr[1];
      const merged = {
        ...editorConfigured,
        ...ResolveConfig.mergeOverrides({...result}, filePath)
      };

      if(!result && !editorConfigured) {
        return null;
      }

      return merged;
    };

    if(loadOpts.sync) {
      return unwrapAndMerge(arr);
    }

    return Promise.all(arr).then(unwrapAndMerge);
  }

  static clearCache() {
    mem.clear(ResolveConfig.getExplorerMemoized);
    ResolveEditorConfig.clearCache();
  }

  static resolveConfig(filePath, opts) {
    return ResolveConfig.resolveConfigPath(filePath, opts, false);
  }

  static resolveConfigSync(filePath, opts) {
    return ResolveConfig.resolveConfigPath(filePath, opts, true);
  }

  static resolveConfigFile(filePath) {
    return ResolveConfig.getLoadFunction({sync: false})(filePath).then((result) => (result ? result.filePath : null));
  }

  static resolveConfigFileSync(filePath) {
    const result = ResolveConfig.getLoadFunction({sync: true})(filePath);
    return result ? result.filePath : null;
  }

  static mergeOverrides(configResult, filePath) {
    const options = {...configResult.config};
    if(filePath && options.overrides) {
      const relativeFilePath = path.relative(
        path.dirname(configResult.filePath),
        filePath
      );
      for(const override of options.overrides) {
        if(
          ResolveConfig.pathMatchesGlobs(
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
  }

  // Based on eslint: https://github.com/eslint/eslint/blob/master/lib/config/config-ops.js
  static pathMatchesGlobs(filePath, patterns, excludedPatterns) {
    const patternList = [].concat(patterns);
    const excludedPatternList = [].concat(excludedPatterns || []);
    const opts = {matchBase: true};

    return (
      patternList.some((pattern) => minimatch(filePath, pattern, opts)) &&
      !excludedPatternList.some((excludedPattern) => minimatch(filePath, excludedPattern, opts))
    );
  }
}
