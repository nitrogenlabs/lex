/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import evaluate from 'eval';
import {relative as pathRelative, resolve as pathResolve} from 'path';
import type {Compilation} from 'webpack';
import {EntryPlugin as WebpackEntryPlugin} from 'webpack';

/**
 * Returns the child compiler name e.g. 'html-webpack-plugin for "index.html"'
 */
const getCompilerName = (context: string, filename: string): string => {
  const absolutePath: string = pathResolve(context, filename);
  const relativePath: string = pathRelative(context, absolutePath);
  return `favicons-webpack-plugin for "${(absolutePath.length < relativePath.length ? absolutePath : relativePath)}"`;
};

export const compileTemplate = (options, context, compilation: Compilation) => {
  // The entry file is just an empty helper as the dynamic template
  // require is added in "loader.js"
  const {background, icons, logo, prefix: outputFilePrefix, persistentCache, statsFilename, title: appName} = options;
  const {publicPath} = compilation.outputOptions;
  const outputOptions = {filename: statsFilename, publicPath};

  // Create an additional child compiler which takes the template
  // and turns it into an Node.JS html factory.
  // This allows us to use loaders during the compilation
  const compilerName: string = getCompilerName(context, statsFilename);
  const childCompiler = compilation.createChildCompiler(compilerName, outputOptions);
  childCompiler.context = context;
  const queryOptions: string = JSON.stringify({appName, background, icons, outputFilePrefix, persistentCache});
  const entry = `!!${require.resolve('./favicons')}?${queryOptions}!${logo}`;
  new WebpackEntryPlugin(context, entry).apply(childCompiler);

  // Fix for "Uncaught TypeError: __webpack_require__(...) is not a function"
  // Hot module replacement requires that every child compiler has its own
  // cache. @see https://github.com/ampedandwired/html-webpack-plugin/pull/179
  // (webpack 4 compliant + back compat)
  childCompiler.hooks.compilation.tap
    .bind(childCompiler.hooks.compilation, 'FaviconsPluginCompilation')(
      (compilation) => {
        const {cache} = compilation;

        if(cache) {
          if(!cache[compilerName]) {
            cache[compilerName] = {};
          }

          compilation.cache = cache[compilerName];
        }

        compilation.hooks.optimizeChunkAssets.tapAsync
          .bind(compilation.hooks.optimizeChunkAssets, 'FaviconsPluginOptimizeChunkAssets')(
            (chunks, callback) => {
              const {assets, errors} = compilation;

              if(!chunks[0]) {
                return callback(errors[0] || 'FaviconsPlugin Error: Icon generation failed');
              }

              const resultFile = chunks[0].files[0];
              const resultCode = assets[resultFile].source();
              let resultJson;

              try {
                resultJson = JSON.stringify(evaluate(resultCode));
                compilation.assets[resultFile] = {size: () => resultJson.length, source: () => resultJson};
                return callback(null);
              } catch(resultError) {
                return callback(resultError);
              }
            });
      });

  // Compile and return a promise
  return new Promise((resolve, reject) => {
    childCompiler.runAsChild((error, entries, childCompilation) => {
      if(error) {
        return reject(error);
      }

      const {assets, errors, hash} = childCompilation;

      // Replace [hash] placeholders in filename
      const outputName = compilation.mainTemplate.hooks.assetPath.call(
        outputOptions.filename,
        {chunk: entries[0], hash}
      );

      // Resolve / reject the promise
      if(errors && errors.length) {
        const errorDetails: string = errors.map((compilationError: Error) => compilationError.message).join('\n');
        return reject(new Error(`FaviconsPlugin Error:\n${errorDetails}`));
      }

      return resolve({outputName, stats: JSON.parse(assets[outputName].source() as string)});
    });
  });
};
