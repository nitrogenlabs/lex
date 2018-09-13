import path from 'path';
import SingleEntryPlugin from 'webpack/lib/SingleEntryPlugin';

/**
 * Returns the child compiler name e.g. 'html-webpack-plugin for "index.html"'
 */
const getCompilerName = (context: string, filename: string): string => {
  const absolutePath: string = path.resolve(context, filename);
  const relativePath: string = path.relative(context, absolutePath);
  return `favicons-webpack-plugin for "${(absolutePath.length < relativePath.length ? absolutePath : relativePath)}"`;
};

export const compileTemplate = (options, context, compilation) => {
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
  new SingleEntryPlugin(context, `!!${require.resolve('./favicons')}?${queryOptions}!${logo}`).apply(childCompiler);

  // Fix for "Uncaught TypeError: __webpack_require__(...) is not a function"
  // Hot module replacement requires that every child compiler has its own
  // cache. @see https://github.com/ampedandwired/html-webpack-plugin/pull/179
  // (webpack 4 compliant + back compat)
  childCompiler.hooks.compilation.tap
    .bind(childCompiler.hooks.compilation, 'FaviconsPluginCompilation')(
      (compilation) => {
        const {cache} = compilation;

        console.log('compileTemplate::cache', cache);
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

              console.log('compileTemplate::chunks', chunks);
              if(!chunks[0]) {
                return callback(errors[0] || 'FaviconsPlugin Error: Icon generation failed');
              }

              const resultFile = chunks[0].files[0];
              const resultCode = assets[resultFile].source();
              let resultJson;

              try {
                resultJson = JSON.stringify(eval(resultCode));
                compilation.assets[resultFile] = {size: () => resultJson.length, source: () => resultJson};
                return callback(null);
              } catch(resultError) {
                return callback(resultError);
              }
            });
      });

  // Compile and return a promise
  return new Promise((resolve, reject) => {
    console.log('compileTemplate::promise::1');
    childCompiler.runAsChild((error, entries, childCompilation) => {
      console.log('compileTemplate::promise::2', error);
      if(error) {
        return reject(error);
      }

      console.log('compileTemplate::promise::3');
      // Replace [hash] placeholders in filename
      const outputName = compilation.mainTemplate.hooks.assetPath.call(
        outputOptions.filename,
        {chunk: entries[0], hash: childCompilation.hash}
      );

      console.log('compileTemplate::promise::4::outputName', outputName);
      // Resolve / reject the promise
      if(childCompilation && childCompilation.errors && childCompilation.errors.length) {
        const {errors} = childCompilation;
        const errorDetails: string = errors.map((compilationError: Error) => compilationError.message).join('\n');
        return reject(new Error(`FaviconsPlugin Error:\n${errorDetails}`));
      }

      return resolve({outputName, stats: JSON.parse(childCompilation.assets[outputName].source())});
    });
  });
};
