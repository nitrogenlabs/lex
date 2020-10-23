/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
const {StaticSitePlugin} = require('@nlabs/webpack-plugin-static-site');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const fs = require('fs');
const glob = require('glob');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const isEmpty = require('lodash/isEmpty');
const os = require('os');
const path = require('path');
const SVGSpritemapPlugin = require('svg-spritemap-webpack-plugin');
const webpack = require('webpack');
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');
const {merge} = require('webpack-merge');
const {WebpackPluginServe} = require('webpack-plugin-serve');

const {getNodePath, relativeFilePath} = require('./dist/utils');

const {DefinePlugin} = webpack;
const environment = process.env.NODE_ENV || 'development';
const isProduction = environment === 'production';
const lexConfig = JSON.parse(process.env.LEX_CONFIG) || {};
const envVariables = lexConfig.env || {NODE_ENV: environment};
const {env: localEnvironment} = process;
const allEnvVariables = {...envVariables, ...localEnvironment};
const processVariables = Object.keys(allEnvVariables).reduce((list, varName) => {
  list[`process.env.${varName}`] = JSON.stringify(allEnvVariables[varName]);
  return list;
}, {});

const babelOptions = require(path.resolve(__dirname, './babelOptions.js'));
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
  new DefinePlugin(processVariables)
];

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
const imgPath = `${sourceFullPath}/img/`;
const fontPath = `${sourceFullPath}/fonts/`;
const docPath = `${sourceFullPath}/docs/`;

if(fs.existsSync(imgPath)) {
  staticPaths.push({from: imgPath, to: './img/'});
  watchIgnorePaths.push(imgPath);
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
    template: `${sourceFullPath}/${lexConfig.entryHTML}`
  }));
}

let outputFilename = outputFile;

if(outputFile) {
  outputFilename = outputFile;
} else if(outputHash) {
  outputFilename = '[name].[hash].js';
} else {
  outputFilename = '[name].js';
}

// Loader paths
const sourceLoaderPath = relativeFilePath('node_modules/source-map-loader', __dirname);
const babelLoaderPath = relativeFilePath('node_modules/babel-loader', __dirname);
const styleLoaderPath = relativeFilePath('node_modules/style-loader', __dirname);
const cssLoaderPath = relativeFilePath('node_modules/css-loader', __dirname);
const postcssLoaderPath = relativeFilePath('node_modules/postcss-loader', __dirname);
const htmlLoaderPath = relativeFilePath('node_modules/html-loader', __dirname);
const fileLoaderPath = relativeFilePath('node_modules/file-loader', __dirname);
const jsonLoaderPath = relativeFilePath('node_modules/json-loader', __dirname);
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
    devtool: 'inline-cheap-source-map',
    entry: {
      index: `${sourceFullPath}/${lexConfig.entryJS}`
    },
    mode: environment,
    module: {
      rules: [
        {
          enforce: 'pre',
          exclude: /(node_modules)/,
          include: [sourceFullPath],
          loader: sourceLoaderPath,
          test: /\.(js|ts|tsx)$/
        },
        {
          exclude: /(node_modules)/,
          loader: babelLoaderPath,
          options: {...babelOptions, cacheDirectory: true},
          test: /\.(js|ts|tsx)$/
        },
        {
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
            }
          ]
        },
        {
          loader: jsonLoaderPath,
          test: /\.json$/
        },
        {
          loader: fileLoaderPath,
          test: /\.(gif|jpg|png|svg)$/
        }
      ]
    },
    optimization: libraryName ? {} : {
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
    },
    output: {
      filename: outputFilename,
      library: libraryName,
      libraryTarget,
      path: outputFullPath,
      publicPath: '/'
    },
    plugins,
    resolve: {
      alias,
      extensions: ['*', '.mjs', '.js', '.ts', '.tsx', '.jsx', '.json', '.gql', '.graphql']
    },
    stats: {
      warningsFilter: [/Failed to parse source map/]
    },
    target: preset || targetEnvironment
  };

  // Add development plugins
  if(!isProduction) {
    const hotReactDom = relativeFilePath('node_modules/@hot-loader/react-dom', __dirname);

    webpackConfig.resolve.alias = {
      ...webpackConfig.resolve.alias,
      'react-dom': hotReactDom,
      webpack: webpackPath
    };
    webpackConfig.optimization = {minimize: false};
    webpackConfig.entry.wps = relativeFilePath('node_modules/webpack-plugin-serve/client.js', __dirname);
    webpackConfig.plugins.push(
      new WebpackPluginServe({
        client: {
          silent: process.env.LEX_QUIET === 'true'
        },
        historyFallback: {
          disableDotRule: true,
          index: '/index.html',
          rewrites: [
            // Webpack Serve Plugin Websocket
            {
              from: '/wps',
              to: (context) => (context.parsedUrl.pathname)
            },

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
        log: {level: 'trace'},
        open: process.env.WEBPACK_DEV_OPEN === 'true',
        port: 9000,
        progress: true,
        ramdisk: os.platform() !== 'win32',
        static: [outputFullPath],
        waitForBuild: true
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
    const siteLogo = `${sourceFullPath}/img/logo.png`;

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
