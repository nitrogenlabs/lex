/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {StaticSitePlugin} from '@nlabs/webpack-plugin-static-site';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import CompressionWebpackPlugin from 'compression-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import cssnano from 'cssnano';
import DotenvPlugin from 'dotenv-webpack';
import {EsbuildPlugin} from 'esbuild-loader';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';
import {existsSync} from 'fs';
import {sync as globSync} from 'glob';
import HtmlWebPackPlugin from 'html-webpack-plugin';
import isEmpty from 'lodash/isEmpty.js';
import {resolve as pathResolve} from 'path';
import postcssBrowserReporter from 'postcss-browser-reporter';
import postcssCustomProperties from 'postcss-custom-properties';
import postcssFlexbugsFixes from 'postcss-flexbugs-fixes';
import postcssFor from 'postcss-for';
import postcssImport from 'postcss-import';
import postcssNesting from 'postcss-nesting';
import postcssPercentage from 'postcss-percentage';
import postcssPresetEnv from 'postcss-preset-env';
import postcssUrl from 'postcss-url';
import SVGSpriteMapPlugin from 'svg-spritemap-webpack-plugin';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import {URL} from 'url';
import {default as webpack} from 'webpack';
import {BundleAnalyzerPlugin} from 'webpack-bundle-analyzer';
import {merge} from 'webpack-merge';
import {WebpackPluginServe} from 'webpack-plugin-serve';

import {relativeFilePath, relativeNodePath} from './dist/utils/file.js';

const {ProgressPlugin, ProvidePlugin} = webpack;
const isProduction = process.env.NODE_ENV === 'production';
const lexConfig = JSON.parse(process.env.LEX_CONFIG) || {};
const dirName = new URL('.', import.meta.url).pathname;

const {
  isStatic,
  outputFullPath,
  sourceFullPath,
  outputFile,
  outputHash,
  libraryName,
  libraryTarget,
  preset,
  targetEnvironment = 'es2015',
  webpack: webpackCustom
} = lexConfig;

const webpackPublicPath = webpackCustom?.publicPath || './src/public';

// Filter out Lex-specific properties from webpack config
const {publicPath: _, ...webpackConfig} = webpackCustom || {};

// Only add plugins if they are needed
const plugins = [
  new ProgressPlugin({
    activeModules: false,
    entries: true,
    modules: true,
    dependencies: true,
    percentBy: null
  }),
  new DotenvPlugin({
    path: pathResolve(process.cwd(), '.env'),
    systemvars: false
  })
];

const isWeb = (preset || targetEnvironment) === 'web';
const isReactNative = preset === 'react-native';

if(isWeb) {
  plugins.push(
    new CompressionWebpackPlugin({algorithm: 'gzip'}),
    new ProvidePlugin({
      process: 'process/browser',
      React: pathResolve(dirName, './node_modules/react')
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

if(globSync(svgPaths, globOptions).length) {
  plugins.push(
    new SVGSpriteMapPlugin(svgPaths, {
      input: {
        allowDuplicates: false
      },
      output: {
        chunk: {keep: true},
        filename: './icons/icons.svg'
      },
      sprite: {
        prefix: false
      }
    })
  );
}

// If there is are static directories, make sure we copy the files over
const staticPaths = [];
const watchIgnorePaths = [
  `${sourceFullPath}/**/**.gif`,
  `${sourceFullPath}/**/**.jpg`,
  `${sourceFullPath}/**/**.png`
];
const imagePath = `${sourceFullPath}/images/`;
const fontPath = `${sourceFullPath}/fonts/`;
const docPath = `${sourceFullPath}/docs/`;

// Handle publicPath for static assets
const publicPathFull = pathResolve(process.cwd(), webpackPublicPath);
if(existsSync(publicPathFull)) {
  staticPaths.push({from: publicPathFull, to: './public/'});
  watchIgnorePaths.push(publicPathFull);
}

if(existsSync(imagePath)) {
  staticPaths.push({from: imagePath, to: './images/'});
  watchIgnorePaths.push(imagePath);
}

if(existsSync(fontPath)) {
  staticPaths.push({from: fontPath, to: './fonts/'});
  watchIgnorePaths.push(fontPath);
}

if(existsSync(docPath)) {
  staticPaths.push({from: docPath, to: './docs/'});
}

if(staticPaths.length) {
  plugins.push(new CopyWebpackPlugin({patterns: staticPaths}));
}

if(existsSync(`${sourceFullPath}/${lexConfig.entryHTML}`)) {
  plugins.push(
    new HtmlWebPackPlugin({
      filename: './index.html',
      minify: isProduction,
      scriptLoading: 'defer',
      showErrors: !isProduction,
      template: `${sourceFullPath}/${lexConfig.entryHTML}`
    })
  );

    // Add fallback for missing static assets
  const missingAssets = [];
  const requiredAssets = ['favicon.ico', 'images/logo-icon-64.png', 'manifest.json'];

  requiredAssets.forEach(asset => {
    if (!existsSync(`${sourceFullPath}/${asset}`)) {
      missingAssets.push(asset);
    }
  });

  if (missingAssets.length > 0) {
    // Create empty fallback files for missing assets
    plugins.push(
      new CopyWebpackPlugin({
        patterns: missingAssets.map(asset => ({
          from: pathResolve(dirName, 'emptyModule.js'),
          to: `${outputFullPath}/${asset}`,
          transform() {
            // Return empty content for missing assets
            return '';
          }
        }))
      })
    );
  }
}

let outputFilename = outputFile;

if(outputFile) {
  outputFilename = outputFile;
} else if(outputHash || (isWeb && isProduction)) {
  outputFilename = '[name].[hash].js';
} else {
  outputFilename = '[name].js';
}

const resolvePlugins = [];
if(existsSync(`${sourceFullPath}/tsconfig.json`)) {
  resolvePlugins.push(new TsconfigPathsPlugin({
    configFile: `${sourceFullPath}/../tsconfig.json`
  }));
}

// Loader paths
const esbuildLoaderPath = relativeNodePath('esbuild-loader', dirName);
const cssLoaderPath = relativeNodePath('css-loader', dirName);
const graphqlLoaderPath = relativeNodePath('graphql-tag/loader', dirName);
const htmlLoaderPath = relativeNodePath('html-loader', dirName);
const postcssLoaderPath = relativeNodePath('postcss-loader', dirName);
const sourceMapLoaderPath = relativeNodePath('source-map-loader', dirName);
const styleLoaderPath = relativeNodePath('style-loader', dirName);
const webpackPath = relativeNodePath('webpack', dirName);

// Aliases
const aliasPaths = {
  '@nlabs/arkhamjs': relativeNodePath('@nlabs/arkhamjs', process.cwd()),
  '@nlabs/arkhamjs-utils-react': relativeNodePath(
    '@nlabs/arkhamjs-utils-react',
    process.cwd()
  ),
  '@nlabs/utils': '/Users/nitrog7/.nvm/versions/node/v22.14.0/lib/node_modules/@nlabs/utils',
  'core-js': relativeNodePath('core-js', dirName),
  process: relativeNodePath('process', dirName),
  react: relativeNodePath('react', process.cwd()),
  'react-dom': relativeNodePath('react-dom', process.cwd()),
  'regenerator-runtime': relativeNodePath('regenerator-runtime', dirName)
};
const aliasKeys = Object.keys(aliasPaths);
const alias = aliasKeys.reduce((aliases, key) => {
  if(!isEmpty(aliasPaths[key])) {
    aliases[key] = aliasPaths[key];
  }

  return aliases;
}, {});

// Webpack config
export default (webpackEnv, webpackOptions) => {
  const {bundleAnalyzer, watch} = webpackOptions;
  const webpackConfig = {
    bail: true,
    cache: !isProduction,
    devtool: isProduction
      ? 'inline-cheap-module-source-map'
      : 'eval-cheap-module-source-map',
    entry: {
      index: `${sourceFullPath}/${lexConfig.entryJs}`
    },
    externals: isReactNative ? {'react-native': true} : undefined,
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
          test: /\.js$/,
          include: /node_modules/,
          type: 'javascript/auto'
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
            /node_modules\/(?!(react-native))/,
            `${sourceFullPath}/**/*.test.js*`,
            `${sourceFullPath}/**/*.test.ts*`
          ],
          include: sourceFullPath,
          loader: esbuildLoaderPath,
          options: {
            loader: 'tsx',
            target: targetEnvironment === 'node' ? 'node16' : 'es2016'
          },
          resolve: {
            symlinks: true
          },
          test: /\.(ts|tsx|js)$/
        },
        {
          exclude: [pathResolve(sourceFullPath, lexConfig.entryHTML)],
          include: sourceFullPath,
          test: /\.html$/,
          use: [
            {
              loader: htmlLoaderPath,
              options: {
                minimize: isProduction,
                sources: {
                  list: [
                    // Exclude static assets from being processed as modules
                    '...',
                    {
                      tag: 'link',
                      attribute: 'href',
                      type: 'src',
                      filter: (tag, attribute, attributes) => {
                        // Don't process static assets as modules
                        const href = attributes[attribute];
                        return !href || !href.match(/\.(ico|png|jpg|jpeg|gif|svg|json)$/);
                      }
                    },
                    {
                      tag: 'script',
                      attribute: 'src',
                      type: 'src',
                      filter: (tag, attribute, attributes) => {
                        // Don't process static assets as modules
                        const src = attributes[attribute];
                        return !src || !src.match(/\.(ico|png|jpg|jpeg|gif|svg|json)$/);
                      }
                    }
                  ]
                }
              }
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
                    postcssImport({addDependencyTo: webpack}),
                    postcssUrl(),
                    postcssFor(),
                    postcssPercentage({
                      floor: true,
                      precision: 9,
                      trimTrailingZero: true
                    }),
                    postcssCustomProperties({
                      extensions: ['.css'],
                      inject: {
                        insertAt: 'top'
                      },
                      minimize: true,
                      preserve: false,
                      strict: false,
                      warnings: false
                    }),
                    tailwindcss(),
                    autoprefixer(),
                    postcssNesting(),
                    postcssFlexbugsFixes(),
                    postcssPresetEnv({
                      stage: 0
                    }),
                    cssnano({autoprefixer: false}),
                    postcssBrowserReporter()
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
          test: /\.(gif|jpg|png|svg)$/,
          type: 'asset/resource'
        },
        {
          // Optimize images and videos from publicPath
          test: /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|ogg|mp3|wav|flac|aac)$/,
          include: publicPathFull,
          type: 'asset/resource',
          generator: {
            filename: 'public/[name].[hash][ext]'
          },
          use: isProduction ? [
            {
              loader: 'image-webpack-loader',
              options: {
                mozjpeg: {
                  progressive: true,
                  quality: 65
                },
                optipng: {
                  enabled: false
                },
                pngquant: {
                  quality: [0.65, 0.90],
                  speed: 4
                },
                gifsicle: {
                  interlaced: false
                },
                webp: {
                  quality: 75
                }
              }
            }
          ] : []
        },
        {
          // Handle missing static assets gracefully
          test: /\.(ico|json)$/,
          type: 'asset/resource',
          generator: {
            filename: '[name][ext]'
          }
        },


        {
          exclude: /(node_modules)/,
          include: sourceFullPath,
          loader: graphqlLoaderPath,
          test: /\.(gql|graphql)$/
        }
      ]
    },
    optimization:
      isProduction && isWeb
        ? {
          minimizer: [
            new EsbuildPlugin({
              css: true,
              target: targetEnvironment
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
        }
        : {},
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
      extensions: [
        '.*',
        '.mjs',
        '.js',
        '.ts',
        '.tsx',
        '.jsx',
        '.json',
        '.gql',
        '.graphql'
      ],
      fallback: {
        assert: relativeNodePath('assert', dirName),
        buffer: relativeNodePath('buffer', dirName),
        crypto: relativeNodePath('crypto-browserify', dirName),
        http: relativeNodePath('stream-http', dirName),
        https: relativeNodePath('https-browserify', dirName),
        os: relativeNodePath('os-browserify/browser.js', dirName),
        path: relativeNodePath('path-browserify', dirName),
        process: relativeNodePath('process/browser.js', dirName),
        stream: relativeNodePath('stream-browserify', dirName),
        util: relativeNodePath('util', dirName),
        vm: relativeNodePath('vm-browserify', dirName)
      },
      mainFiles: ['index'],
      modules: [sourceFullPath, 'node_modules', relativeNodePath('', dirName), '/Users/nitrog7/.nvm/versions/node/v22.14.0/lib/node_modules'],
      plugins: resolvePlugins,
      unsafeCache: {
        node_modules: true
      }
    },
    target: isWeb ? 'web' : 'node'
  };

  // Add development plugins
  if(!isProduction) {
    webpackConfig.resolve.alias = {
      ...webpackConfig.resolve.alias,
      webpack: webpackPath
    };
    webpackConfig.optimization = {minimize: false};
    webpackConfig.entry.wps = relativeNodePath(
      'webpack-plugin-serve/client.js',
      dirName
    );
    webpackConfig.stats = {errorDetails: true};
    webpackConfig.plugins.push(
      new WebpackPluginServe({
        client: {
          silent: process.env.LEX_QUIET === 'true'
        },
        historyFallback: {
          disableDotRule: true,
          htmlAcceptHeaders: ['text/html', '*/*'],
          index: '/index.html',
          logger: console.log.bind(console),
          rewrites: [
            // wps
            {
              from: '/wps',
              to: ({parsedUrl: {pathname}}) => pathname
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

            // Static files
            {
              from: /\.[css,gif,ico,jpg,json,png,svg]/,
              to: ({parsedUrl: {pathname}}) => pathname
            }
          ],
          verbose: !(process.env.LEX_QUIET === 'true')
        },
        hmr: false,
        log: {level: 'trace'},
        middleware: (app) =>
          app.use(async (ctx, next) => {
            if(ctx.path.match(/^\/wps/)) {
              const {accept, Accept, ...remainingHeaders} =
                ctx.request.header;
              ctx.request.header = remainingHeaders;
            }
            await next();
          }),
        open: process.env.WEBPACK_DEV_OPEN === 'true',
        port: 7001,
        progress: 'minimal',
        static: existsSync(outputFullPath) ? [outputFullPath] : [],
        status: true
      })
    );

    if(bundleAnalyzer) {
      webpackConfig.plugins.push(
        new BundleAnalyzerPlugin({openAnalyzer: false})
      );
    }

    if(watch) {
      webpackConfig.bail = false;
      // webpackConfig.watch = true;
      webpackConfig.watchOptions = {
        aggregateTimeout: 500,
        ignored: ['node_modules/**', ...watchIgnorePaths]
      };
    }
  } else {
    // Create site ico files
    const siteLogo = `${sourceFullPath}/images/logo.png`;

    if(existsSync(siteLogo)) {
      plugins.push(
        new FaviconsWebpackPlugin({
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
        })
      );
    }

    if(isStatic) {
      webpackConfig.plugins.push(
        new StaticSitePlugin()
      );
    }

    if(isProduction && isWeb) {
      webpackConfig.optimization.moduleIds = 'deterministic';
    }
  }
  return merge(webpackConfig, webpackConfig);
  return merge(webpackConfig, webpackConfig);
};
