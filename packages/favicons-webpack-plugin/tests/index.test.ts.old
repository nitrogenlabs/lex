import dirCompare from 'dir-compare';
import {promisify} from 'es6-promisify';
import HtmlPlugin from 'html-webpack-plugin';
import path from 'path';
import rimraf from 'rimraf';
import webpack, {Configuration} from 'webpack';

import {FaviconsPlugin} from '../src';

// const webpack: any = promisify(require('webpack'));
const readFile = promisify(require('fs').readFile);
const writeFile = promisify(require('fs').writeFile);
const mkdirp = promisify(require('mkdirp'));

const packageJson = require('../package.json');

const compareOptions = {compareSize: true};
const logoPath: string = path.resolve(__dirname, 'fixtures/logo.png');
const outputId: number = 0;

rimraf.sync(path.resolve(__dirname, '../dist'));

const baseWebpackConfig = (plugin): Configuration => ({
  bail: true,
  devtool: 'eval',
  entry: {
    entry: path.resolve(__dirname, './fixtures/entry.js')
  },
  mode: 'development',
  module: {
    rules: [
      {
        exclude: /(node_modules)/,
        loader: path.resolve(__dirname, '../../../node_modules/babel-loader'),
        options: {
          babelrc: false,
          comments: false,
          presets: ['env']
        },
        test: /\.(js)$/
      }
    ]
  },
  output: {path: path.resolve(__dirname, '../dist', `test-${outputId + 1}`)},
  plugins: [new HtmlPlugin()].concat(plugin),
  resolve: {
    extensions: ['.js']
  }
});

describe('FaviconsPlugin', () => {
  it('should throw error when called without arguments', () => {
    const getPlugin = () => new FaviconsPlugin(null);
    expect(getPlugin).toThrowError();
  });

  it('should take an object with just the logo as argument', () => {
    const plugin = new FaviconsPlugin({logo: logoPath});
    expect(plugin.options.logo).toBe(logoPath);
  });

  it('should generate the expected default result', (done) => {
    console.log('test1');
    const onComplete = (unused, stats) => {
      const {outputPath} = stats.compilation.compiler;
      console.log('onComplete::outputPath', outputPath);
      const expected = path.resolve(__dirname, './fixtures/expected/default');
      console.log('onComplete::expected', expected);
      const compareResult = dirCompare.compareSync(outputPath, expected, compareOptions);
      const diffFiles = compareResult.diffSet.filter((diff) => diff.state !== 'equal');
      expect(diffFiles[0]).toBeUndefined();
      done();
    };

    webpack(baseWebpackConfig(new FaviconsPlugin({icons: {favicons: true}, logo: logoPath})), onComplete);
  });

  // it('should generate a configured JSON file', async () => {
  //   const stats = await webpack(baseWebpackConfig(new FaviconsPlugin({
  //     emitStats: true,
  //     logo: logoPath,
  //     persistentCache: false,
  //     statsFilename: 'iconstats.json'
  //   })));
  //   const {outputPath} = stats.compilation.compiler;
  //   const expected = path.resolve(__dirname, 'fixtures/expected/generate-json');
  //   const compareResult = await dirCompare.compare(outputPath, expected, compareOptions);
  //   const diffFiles = compareResult.diffSet.filter((diff) => diff.state !== 'equal');
  //   expect(diffFiles[0]).toBeUndefined();
  // });

  // it('should work together with the html-webpack-plugin', async () => {
  //   const stats = await webpack(baseWebpackConfig([
  //     new FaviconsPlugin({
  //       emitStats: true,
  //       logo: logoPath,
  //       persistentCache: false,
  //       statsFilename: 'iconstats.json'
  //     }),
  //     new HtmlPlugin()
  //   ]));
  //   const {outputPath} = stats.compilation.compiler;
  //   const expected = path.resolve(__dirname, 'fixtures/expected/generate-html');
  //   const compareResult = await dirCompare.compare(outputPath, expected, compareOptions);
  //   const diffFiles = compareResult.diffSet.filter((diff) => diff.state !== 'equal');
  //   expect(diffFiles[0]).toBeUndefined();
  // });

  // it('should not recompile if there is a cache file', async () => {
  //   const options = baseWebpackConfig([
  //     new FaviconsPlugin({
  //       emitStats: false,
  //       logo: logoPath,
  //       persistentCache: true
  //     }),
  //     new HtmlPlugin()
  //   ]);

  //   // Bring cache file in place
  //   const cacheFile = 'icons-366a3768de05f9e78c392fa62b8fbb80/.cache';
  //   const cacheFileExpected = path.resolve(__dirname, 'fixtures/expected/from-cache/', cacheFile);
  //   const cacheFileDist = path.resolve(__dirname, options.output.path, cacheFile);
  //   await mkdirp(path.dirname(cacheFileDist));
  //   const cache = JSON.parse(await readFile(cacheFileExpected));
  //   cache.version = packageJson.version;
  //   await writeFile(cacheFileDist, JSON.stringify(cache));

  //   const stats = await webpack(options);
  //   const {outputPath} = stats.compilation.compiler;
  //   const expected = path.resolve(__dirname, 'fixtures/expected/from-cache');
  //   const compareResult = await dirCompare.compare(outputPath, expected, compareOptions);
  //   const diffFiles = compareResult.diffSet.filter((diff) => diff.state !== 'equal');
  //   expect(diffFiles[0]).toBeUndefined();
  // });
});
