/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
const {StaticSitePlugin} = require('@nlabs/webpack-plugin-static-site');
const CompressionWebpackPlugin = require('compression-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const DotenvPlugin = require('dotenv-webpack');
const {ESBuildMinifyPlugin} = require('esbuild-loader');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const fs = require('fs');
const glob = require('glob');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const isEmpty = require('lodash/isEmpty');
const ObsoletePlugin = require('obsolete-webpack-plugin');
const path = require('path');
const SVGSpritemapPlugin = require('svg-spritemap-webpack-plugin');
const webpack = require('webpack');
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');
const {merge} = require('webpack-merge');
const {WebpackPluginServe} = require('webpack-plugin-serve');

const {getNodePath, relativeFilePath} = require('./dist/utils');

const {ProgressPlugin, ProvidePlugin} = webpack;
const isProduction = process.env.NODE_ENV === 'production';
const lexConfig = JSON.parse(process.env.LEX_CONFIG) || {};

const {
  isStatic,
  outputFullPath,
  sourceFullPath,
  outputFile,
  outputHash,
  libraryName,
  libraryTarget,
  preset,
  targetEnvironment,
  webpack: webpackCustom
} = lexConfig;

// Only add plugins if they are needed
const plugins = [
  new ProgressPlugin({
    activeModules: false,
    entries: true,
    modules: true,
    dependencies: true,
    percentBy: null
  }),
  new DotenvPlugin({path: path.resolve(process.cwd(), '.env'), systemvars: false})
];

const target = preset || targetEnvironment;
const isWeb = target === 'web';

if(isWeb) {
  plugins.push(
    new CompressionWebpackPlugin({algorithm: 'gzip'}),
    new ProvidePlugin({process: 'process/browser'}),
    new ObsoletePlugin({
      name: 'obsolete',
      promptOnNonTargetBrowser: true,
      template: `
        <div style="background-color: rgb(32, 41, 69); opacity: 0.8; height: 100%; width: 100%; margin: 0; padding: 0; position: absolute; text-align: center; left: 0; right: 0; bottom: 0; top: 0;">
          <div style="color: white; font-size: 20px; margin-top: 10%">
            Your browser is not supported.<br/><br/>
            Please use a recent
            <a href="https://www.microsoft.com/en-us/edge" style="color:white">Edge</a>,
            <a href="https://www.mozilla.org/en-US/firefox/new/" style="color:white">Firefox</a>,
            <a href="https://www.google.com/chrome/" style="color:white">Chrome</a> or
            Safari.
          </div>
        </div>
      `
    })
  );
}

// Add svg files
const globOptions = {
  cwd: sourceFullPath,
  dot: false,
  nodir: true,
  nosort: true
};

const svgPaths = `${sourceFullPath}/icons/**/**.svg`;

if(glob.sync(svgPaths, globOptions).length) {
  plugins.push(new SVGSpritemapPlugin(svgPaths, {
    output: {
      chunk: {keep: true},
      filename: './icons/icons.svg'
    },
    sprite: {
      prefix: false
    }
  }));
}

// If there is are static directories, make sure we copy the files over
const staticPaths = [];
const watchIgnorePaths = [`${sourceFullPath}/**/**.gif`, `${sourceFullPath}/**/**.jpg`, `${sourceFullPath}/**/**.png`];
const imagePath = `${sourceFullPath}/images/`;
const fontPath = `${sourceFullPath}/fonts/`;
const docPath = `${sourceFullPath}/docs/`;

if(fs.existsSync(imagePath)) {
  staticPaths.push({from: imagePath, to: './images/'});
  watchIgnorePaths.push(imagePath);
}

if(fs.existsSync(fontPath)) {
  staticPaths.push({from: fontPath, to: './fonts/'});
  watchIgnorePaths.push(fontPath);
}

if(fs.existsSync(docPath)) {
  staticPaths.push({from: docPath, to: './docs/'});
}

if(staticPaths.length) {
  plugins.push(new CopyWebpackPlugin({patterns: staticPaths}));
}

if(fs.existsSync(`${sourceFullPath}/${lexConfig.entryHTML}`)) {
  plugins.push(new HtmlWebPackPlugin({
    filename: './index.html',
    minify: isProduction,
    scriptLoading: 'defer',
    showErrors: !isProduction,
    template: `${sourceFullPath}/${lexConfig.entryHTML}`
  }));
}

let outputFilename = outputFile;

if(outputFile) {
  outputFilename = outputFile;
} else if(outputHash || (isWeb && isProduction)) {
  outputFilename = '[name].[hash].js';
} else {
  outputFilename = '[name].js';
}

// Loader paths
const esbuildLoaderPath = relativeFilePath('node_modules/esbuild-loader', __dirname);
const cssLoaderPath = relativeFilePath('node_modules/css-loader', __dirname);
const fileLoaderPath = relativeFilePath('node_modules/file-loader', __dirname);
const graphqlLoaderPath = relativeFilePath('node_modules/graphql-tag/loader', __dirname);
const htmlLoaderPath = relativeFilePath('node_modules/html-loader', __dirname);
const jsonLoaderPath = relativeFilePath('node_modules/json-loader', __dirname);
const postcssLoaderPath = relativeFilePath('node_modules/postcss-loader', __dirname);
const sourceMapLoaderPath = relativeFilePath('node_modules/source-map-loader', __dirname);
const styleLoaderPath = relativeFilePath('node_modules/style-loader', __dirname);
const webpackPath = relativeFilePath('node_modules/webpack', __dirname);

// Aliases
const aliasPaths = {
  '@nlabs/arkhamjs': relativeFilePath('node_modules/@nlabs/arkhamjs', process.cwd()),
  '@nlabs/arkhamjs-utils-react': relativeFilePath('node_modules/@nlabs/arkhamjs-utils-react', process.cwd()),
  'core-js': getNodePath('core-js'),
  react: relativeFilePath('node_modules/react', process.cwd()),
  'react-dom': relativeFilePath('node_modules/react-dom', process.cwd()),
  'regenerator-runtime': getNodePath('regenerator-runtime')
};
const aliasKeys = Object.keys(aliasPaths);
const alias = aliasKeys.reduce((aliases, key) => {
  if(!isEmpty(aliasPaths[key])) {
    aliases[key] = aliasPaths[key];
  }

  return aliases;
}, {});

// Webpack config
module.exports = (webpackEnv, webpackOptions) => {
  const {bundleAnalyzer, watch} = webpackOptions;
  const webpackConfig = {
    bail: true,
    cache: !isProduction,
    devtool: isProduction ? 'inline-cheap-module-source-map' : 'eval-cheap-module-source-map',
    entry: {
      index: `${sourceFullPath}/${lexConfig.entryJs}`
    },
    ignoreWarnings: [/Failed to parse source map/],
    mode: isProduction ? 'production' : 'development',
    module: {
      rules: [
        {
          test: /\.m?js/,
          resolve: {
            fullySpecified: false
          }
        },
        {
          enforce: 'pre',
          exclude: /(node_modules)/,
          include: sourceFullPath,
          loader: sourceMapLoaderPath,
          test: /\.(ts|tsx|js)$/
        },
        {
          exclude: [
            /(node_modules)/,
            `${sourceFullPath}/**/*.test.js*`,
            `${sourceFullPath}/**/*.test.ts*`
          ],
          include: sourceFullPath,
          loader: esbuildLoaderPath,
          options: {
            loader: 'tsx',
            target: 'es2015'
          },
          test: /\.(ts|tsx|js)$/
        },
        {
          exclude: /(node_modules)/,
          include: sourceFullPath,
          test: /\.html$/,
          use: [
            {
              loader: htmlLoaderPath,
              options: {minimize: isProduction}
            }
          ]
        },
        {
          test: /\.css$/,
          use: [
            styleLoaderPath,
            {
              loader: cssLoaderPath,
              options: {
                importLoaders: 1
              }
            },
            {
              loader: postcssLoaderPath,
              options: {
                postcssOptions: {
                  plugins: [
                    require(relativeFilePath('node_modules/postcss-import', __dirname))({addDependencyTo: webpack}),
                    require(relativeFilePath('node_modules/postcss-url', __dirname)),
                    require(relativeFilePath('node_modules/postcss-for', __dirname)),
                    require(relativeFilePath('node_modules/postcss-percentage', __dirname))({
                      floor: true,
                      precision: 9,
                      trimTrailingZero: true
                    }),
                    require(relativeFilePath('node_modules/postcss-custom-properties', __dirname))({
                      preserve: false,
                      strict: false,
                      warnings: false
                    }),
                    require(relativeFilePath('node_modules/autoprefixer', __dirname)),
                    require(relativeFilePath('node_modules/postcss-nesting', __dirname)),
                    require(relativeFilePath('node_modules/postcss-flexbugs-fixes', __dirname)),
                    require(relativeFilePath('node_modules/postcss-preset-env', __dirname))({
                      stage: 0
                    }),
                    require(relativeFilePath('node_modules/cssnano', __dirname))({autoprefixer: false}),
                    require(relativeFilePath('node_modules/postcss-browser-reporter', __dirname))
                  ]
                }
              }
            },
            {
              loader: esbuildLoaderPath,
              options: {
                loader: 'css',
                minify: true
              }
            }
          ]
        },
        {
          exclude: /(node_modules)/,
          include: sourceFullPath,
          loader: jsonLoaderPath,
          test: /\.json$/
        },
        {
          exclude: /(node_modules)/,
          include: sourceFullPath,
          loader: fileLoaderPath,
          test: /\.(gif|jpg|png|svg)$/
        },
        {
          exclude: /(node_modules)/,
          include: sourceFullPath,
          loader: graphqlLoaderPath,
          test: /\.(gql|graphql)$/
        }
      ]
    },
    optimization: (isProduction && isWeb) ? {
      minimizer: [
        new ESBuildMinifyPlugin({
          css: true,
          target: 'es2015'
        })
      ],
      runtimeChunk: 'single',
      splitChunks: {
        cacheGroups: {
          vendor: {
            chunks: 'all',
            minSize: 0,
            name: 'vendors',
            test: /[\\/]node_modules[\\/]/
          }
        }
      },
      usedExports: true
    } : {},
    output: {
      filename: outputFilename,
      library: libraryName,
      libraryTarget,
      path: outputFullPath,
      publicPath: '/'
    },
    plugins,
    recordsPath: relativeFilePath('webpack.records.json', process.cwd()),
    resolve: {
      alias,
      extensions: ['*', '.mjs', '.js', '.ts', '.tsx', '.jsx', '.json', '.gql', '.graphql'],
      fallback: {
        assert: require.resolve('assert/'),
        crypto: require.resolve('crypto-browserify'),
        fs: require.resolve('fs-extra'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify/browser'),
        path: require.resolve('path-browserify'),
        process: require.resolve('process/browser'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util/')
      },
      mainFiles: ['index'],
      modules: [sourceFullPath, 'node_modules'],
      unsafeCache: {
        node_modules: true
      }
    },
    // stats: {
    //   warningsFilter: [/Failed to parse source map/]
    // },
    target
  };

  // Add development plugins
  if(!isProduction) {
    webpackConfig.resolve.alias = {
      ...webpackConfig.resolve.alias,
      'react-dom': relativeFilePath('node_modules/@hot-loader/react-dom', __dirname),
      webpack: webpackPath
    };
    webpackConfig.optimization = {minimize: false};
    webpackConfig.entry.wps = relativeFilePath('node_modules/webpack-plugin-serve/client.js', __dirname);
    webpackConfig.stats = {errorDetails: true};
    webpackConfig.plugins.push(
      new WebpackPluginServe({
        client: {
          silent: process.env.LEX_QUIET === 'true'
        },
        historyFallback: {
          disableDotRule: true,
          htmlAcceptHeaders: ['text/html','*/*'],
          index: '/index.html',
          rewrites: [
            // Javascript files
            {
              from: /\.js/,
              to: ({parsedUrl: {pathname}}) => {
                const pathUrl = pathname.split('/');
                const fileIndex = pathUrl.length > 1 ? pathUrl.length - 1 : 0;
                return `/${pathUrl[fileIndex]}`;
              }
            },

            // Other static files
            {
              from: /\.[css,gif,ico,jpg,json,png,svg]/,
              to: ({parsedUrl: {pathname}}) => pathname
            }
          ],
          verbose: !(process.env.LEX_QUIET === 'true')
        },
        hmr: false,
        log: {level: 'trace'},
        open: process.env.WEBPACK_DEV_OPEN === 'true',
        port: 7000,
        progress: 'minimal',
        static: [outputFullPath],
        status: true
      }),
    );

    if(bundleAnalyzer) {
      webpackConfig.plugins.push(new BundleAnalyzerPlugin({openAnalyzer: false}));
    }

    if(watch) {
      webpackConfig.bail = false;
      webpackConfig.watch = true;
      webpackConfig.watchOptions = {
        aggregateTimeout: 500,
        ignored: ['node_modules/**', ...watchIgnorePaths]
      };
    }
  } else {
  // Create site ico files
    const siteLogo = `${sourceFullPath}/images/logo.png`;

    if(fs.existsSync(siteLogo)) {
      plugins.push(new FaviconsWebpackPlugin({
        icons: {
          android: true,
          appleIcon: true,
          appleStartup: false,
          coast: false,
          favicons: true,
          firefox: false,
          opengraph: true,
          twitter: true,
          windows: false,
          yandex: false
        },
        logo: siteLogo
      }));
    }

    if(isStatic) {
      webpackConfig.plugins.push(new StaticSitePlugin(), new webpack.HashedModuleIdsPlugin());
    }
  }

  return merge(webpackConfig, webpackCustom);
};
