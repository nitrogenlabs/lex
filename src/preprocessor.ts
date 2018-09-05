import {transform as babelTransform, util as babelUtil} from '@babel/core';
import babelIstanbulPlugin from 'babel-plugin-istanbul';
import jestPreset from 'babel-preset-jest';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export type Path = string;
export type Glob = string;
export type ReporterConfig = [string, Object];
export type ConfigGlobals = object;

export interface HasteConfig {
  defaultPlatform?: string;
  hasteImplModulePath?: string;
  platforms?: string[];
  providesModuleNodeModules: string[];
}

export interface CacheKeyOptions {
  instrument: boolean;
  rootDir: string;
}

export interface TransformOptions {
  instrument: boolean;
}

export interface TransformedSource {
  code: string;
  map?: Object | string;
}

export interface Transformer {
  canInstrument?: boolean;
  createTransformer?: (options: any) => Transformer;

  getCacheKey: (
    fileData: string,
    filePath: Path,
    configStr: string,
    options: CacheKeyOptions,
  ) => string;

  process: (
    sourceText: string,
    sourcePath: Path,
    config: ProjectConfig,
    options?: TransformOptions,
  ) => string | TransformedSource;
}

export interface ProjectConfig {
  automock: boolean;
  browser: boolean;
  cache: boolean;
  cacheDirectory: Path;
  clearMocks: boolean;
  coveragePathIgnorePatterns: string[];
  cwd: Path;
  detectLeaks: boolean;
  detectOpenHandles: boolean;
  displayName?: string;
  errorOnDeprecated: boolean;
  filter?: Path;
  forceCoverageMatch: Glob[];
  globals: ConfigGlobals;
  haste: HasteConfig;
  moduleDirectories: string[];
  moduleFileExtensions: string[];
  moduleLoader: Path,
  moduleNameMapper: any;
  modulePathIgnorePatterns: string[];
  modulePaths: string[];
  name: string;
  prettierPath: string;
  resetMocks: boolean;
  resetModules: boolean;
  resolver?: Path;
  restoreMocks: boolean;
  rootDir: Path;
  roots: Path[];
  runner: string;
  setupFiles: Path[];
  setupTestFrameworkScriptFile?: Path;
  skipFilter: boolean;
  skipNodeResolution: boolean;
  snapshotSerializers: Path[];
  testEnvironment: string;
  testEnvironmentOptions: object;
  testMatch: Glob[];
  testLocationInResults: boolean;
  testPathIgnorePatterns: string[];
  testRegex: string;
  testRunner: string;
  testURL: string;
  timers: 'real' | 'fake';
  transform: any;
  transformIgnorePatterns: Glob[];
  watchPathIgnorePatterns: string[];
  unmockedModulePathPatterns?: string[];
}

const THIS_FILE: Buffer = fs.readFileSync(__filename);

const jestPreprocessor = (options: any) => {
  const updatedOptions = {
    ...options,
    compact: false,
    plugins: (options && options.plugins) || [],
    presets: ((options && options.presets) || []).concat([jestPreset]),
    sourceMaps: 'both'
  };
  delete updatedOptions.cacheDirectory;
  delete updatedOptions.filename;

  return {
    canInstrument: true,
    getCacheKey(
      fileData: string,
      filename: Path,
      configString: string,
      {instrument, rootDir}: CacheKeyOptions
    ): string {
      const babelConfig = JSON.stringify(options, null, 0);

      return crypto
        .createHash('md5')
        .update(THIS_FILE)
        .update('\0', 'utf8')
        .update(JSON.stringify(updatedOptions))
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
    process(
      src: string,
      filename: Path,
      config: ProjectConfig,
      transformOptions: TransformOptions
    ): string | TransformedSource {
      const altExts = config.moduleFileExtensions.map((extension) => `.${extension}`);

      if(babelUtil && !babelUtil.canCompile(filename, altExts)) {
        return src;
      }

      const theseOptions = {filename, ...updatedOptions};

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
