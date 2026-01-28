/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {StaticSitePlugin} from '@nlabs/webpack-plugin-static-site';
import tailwindNesting from '@tailwindcss/nesting';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import CompressionWebpackPlugin from 'compression-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import cssnano from 'cssnano';
import DotenvPlugin from 'dotenv-webpack';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';
import {existsSync} from 'fs';
import {sync as globSync} from 'glob';
import HtmlWebPackPlugin from 'html-webpack-plugin';
import isEmpty from 'lodash/isEmpty.js';
import {createRequire} from 'module';
import {resolve as pathResolve} from 'path';
import postcssBrowserReporter from 'postcss-browser-reporter';
import postcssCustomProperties from 'postcss-custom-properties';
import postcssFlexbugsFixes from 'postcss-flexbugs-fixes';
import postcssImport from 'postcss-import';
import postcssNesting from 'postcss-nesting';
import postcssPresetEnv from 'postcss-preset-env';
import postcssUrl from 'postcss-url';
import SVGSpriteMapPlugin from 'svg-spritemap-webpack-plugin';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import {URL} from 'url';
import {default as webpack} from 'webpack';
import {BundleAnalyzerPlugin} from 'webpack-bundle-analyzer';
import {merge} from 'webpack-merge';
import {WebpackPluginServe} from 'webpack-plugin-serve';

import {LexConfig} from './lib/LexConfig.js';
import {relativeFilePath, relativeNodePath} from './lib/utils/file.js';
import postcssFor from './lib/utils/postcss/postcss-for.js';
import postcssPercentage from './lib/utils/postcss/postcss-percentage.js';
import tail from 'lodash/tail.js';

const {ProgressPlugin, ProvidePlugin} = webpack;
const isProduction = process.env.NODE_ENV === 'production';
const lexConfig = JSON.parse(process.env.LEX_CONFIG) || {};
const dirName = new URL('.', import.meta.url).pathname;
const require = createRequire(import.meta.url);

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

const webpackStaticPath = webpackCustom?.staticPath || './src/static';

const {publicPath: _, staticPath: __, ...webpackConfigFiltered} = webpackCustom || {};

const plugins = [
  new ProgressPlugin({
    activeModules: false,
    entries: true,
    handler(percentage, message, ...args) {
      // custom logic
    },
    modules: true,
    modulesCount: 5000,
    profile: false,
    dependencies: true,
    dependenciesCount: 10000,
    percentBy: null
  }),
  new DotenvPlugin({
    allowEmptyValues: true,
    path: pathResolve(process.cwd(), '.env'),
    safe: false,
    silent: true,
    systemvars: true
  }),
  new webpack.ProvidePlugin({
    Buffer: ['buffer', 'Buffer'],
    process: 'process/browser',
    global: 'global'
  }),
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    global: 'global'
  }),
  {
    apply: (compiler) => {
      compiler.hooks.watchRun.tap('NotifyOnRebuild', () => {
        console.log('\x1b[36m[webpack]\x1b[0m Detected file change. Rebuilding...');
      });
      compiler.hooks.done.tap('NotifyOnRebuild', (stats) => {
        if(stats.hasErrors()) {
          console.log('\x1b[31m[webpack]\x1b[0m Build failed with errors.');
        } else {
          console.log('\x1b[32m[webpack]\x1b[0m Build complete. Watching for changes...');
        }
      });
      compiler.hooks.normalModuleFactory.tap('ImportMetaTransform', (normalModuleFactory) => {
        normalModuleFactory.hooks.parser.for('javascript/auto').tap('ImportMetaTransform', (parser) => {
          parser.hooks.expression.for('import.meta').tap('ImportMetaTransform', (expr) => {
            const dep = new webpack.dependencies.ConstDependency(
              '({ url: typeof document !== "undefined" && document.currentScript && document.currentScript.src ? new URL(document.currentScript.src, window.location.href).href : (typeof window !== "undefined" ? new URL("", window.location.href).href : "") })',
              expr.range
            );
            dep.loc = expr.loc;
            parser.state.module.addPresentationalDependency(dep);
            return true;
          });
          parser.hooks.expression.for('import.meta.url').tap('ImportMetaTransform', (expr) => {
            const dep = new webpack.dependencies.ConstDependency(
              '(typeof document !== "undefined" && document.currentScript && document.currentScript.src ? new URL(document.currentScript.src, window.location.href).href : (typeof window !== "undefined" ? new URL("", window.location.href).href : ""))',
              expr.range
            );
            dep.loc = expr.loc;
            parser.state.module.addPresentationalDependency(dep);
            return true;
          });
        });
        normalModuleFactory.hooks.parser.for('javascript/esm').tap('ImportMetaTransform', (parser) => {
          parser.hooks.expression.for('import.meta').tap('ImportMetaTransform', (expr) => {
            const dep = new webpack.dependencies.ConstDependency(
              '({ url: typeof document !== "undefined" && document.currentScript && document.currentScript.src ? new URL(document.currentScript.src, window.location.href).href : (typeof window !== "undefined" ? new URL("", window.location.href).href : "") })',
              expr.range
            );
            dep.loc = expr.loc;
            parser.state.module.addPresentationalDependency(dep);
            return true;
          });
          parser.hooks.expression.for('import.meta.url').tap('ImportMetaTransform', (expr) => {
            const dep = new webpack.dependencies.ConstDependency(
              '(typeof document !== "undefined" && document.currentScript && document.currentScript.src ? new URL(document.currentScript.src, window.location.href).href : (typeof window !== "undefined" ? new URL("", window.location.href).href : ""))',
              expr.range
            );
            dep.loc = expr.loc;
            parser.state.module.addPresentationalDependency(dep);
            return true;
          });
        });
      });
    }
  }
];

const isWeb = (preset || targetEnvironment) === 'web';
const isReactNative = preset === 'react-native';

if(isWeb) {
  plugins.push(
    new CompressionWebpackPlugin({algorithm: 'gzip'}),
    new ProvidePlugin({
      process: 'process/browser',
      global: 'global',
      React: pathResolve(dirName, './node_modules/react')
    })
  );
}

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

const staticPaths = [];
const watchIgnorePaths = [
  `${sourceFullPath}/**/**.gif`,
  `${sourceFullPath}/**/**.jpg`,
  `${sourceFullPath}/**/**.png`
];
const imagePath = `${sourceFullPath}/images/`;
const fontPath = `${sourceFullPath}/fonts/`;
const docPath = `${sourceFullPath}/docs/`;
const iconPath = `${sourceFullPath}/icons/`;

const staticPathFull = pathResolve(process.cwd(), webpackStaticPath);

if(existsSync(staticPathFull)) {
  staticPaths.push({
    from: staticPathFull,
    globOptions: {
      ignore: ['**/.DS_Store']
    },
    noErrorOnMissing: true,
    to: './'
  });
  watchIgnorePaths.push(staticPathFull);
}

if(existsSync(imagePath)) {
  staticPaths.push({from: imagePath, noErrorOnMissing: true, to: './images/'});
  watchIgnorePaths.push(imagePath);
}

if(existsSync(fontPath)) {
  staticPaths.push({from: fontPath, noErrorOnMissing: true, to: './fonts/'});
  watchIgnorePaths.push(fontPath);
}

if(existsSync(docPath)) {
  staticPaths.push({from: docPath, noErrorOnMissing: true, to: './docs/'});
}

if(existsSync(iconPath)) {
  staticPaths.push({
    from: iconPath,
    globOptions: {
      ignore: ['**/*.svg']
    },
    noErrorOnMissing: true,
    to: './icons/'
  });
  watchIgnorePaths.push(iconPath);
}

if(staticPaths.length) {
  plugins.push(new CopyWebpackPlugin({patterns: staticPaths}));
}

if(existsSync(`${sourceFullPath}/${lexConfig.entryHTML}`)) {
  plugins.push(
    new HtmlWebPackPlugin({
      filename: 'index.html',
      minify: isProduction,
      showErrors: !isProduction,
      template: `${sourceFullPath}/${lexConfig.entryHTML}`,
      inject: true
    })
  );
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

const swcLoaderPath = relativeNodePath('swc-loader', dirName) || 'swc-loader';
const cssLoaderPath = relativeNodePath('css-loader', dirName) || 'css-loader';
const graphqlLoaderPath = relativeNodePath('graphql-tag/loader', dirName) || 'graphql-tag/loader';
const htmlLoaderPath = relativeNodePath('html-loader', dirName) || 'html-loader';
const miniCssExtractPluginPath = relativeNodePath('mini-css-extract-plugin', dirName) || 'mini-css-extract-plugin';
const postcssLoaderPath = relativeNodePath('postcss-loader', dirName) || 'postcss-loader';
const sourceMapLoaderPath = relativeNodePath('source-map-loader', dirName) || 'source-map-loader';
const styleLoaderPath = relativeNodePath('style-loader', dirName) || 'style-loader';
const webpackPath = relativeNodePath('webpack', dirName) || 'webpack';

const aliasPaths = {
  '@nlabs/arkhamjs': relativeNodePath('@nlabs/arkhamjs', process.cwd()),
  '@nlabs/arkhamjs-utils-react': relativeNodePath('@nlabs/arkhamjs-utils-react', process.cwd()),
  buffer: relativeNodePath('buffer', dirName),
  'core-js': relativeNodePath('core-js', dirName),
  process: relativeNodePath('process', dirName),
  react: relativeNodePath('react', process.cwd()),
  'react-dom': relativeNodePath('react-dom', process.cwd()),
  'regenerator-runtime': relativeNodePath('regenerator-runtime', dirName),
  Buffer: relativeNodePath('buffer', dirName)
};
const aliasKeys = Object.keys(aliasPaths);
const alias = aliasKeys.reduce((aliases, key) => {
  if(!isEmpty(aliasPaths[key])) {
    aliases[key] = aliasPaths[key];
  }

  return aliases;
}, {});

export default (webpackEnv, webpackOptions) => {
  const {bundleAnalyzer, watch, entry: cliEntry, mode: cliMode, port} = webpackOptions;
  const envPort = process.env.WEBPACK_DEV_PORT ? parseInt(process.env.WEBPACK_DEV_PORT, 10) : null;
  const finalPort = port || envPort || 3000;
  const entryValue = Array.isArray(cliEntry) ? cliEntry[0] : cliEntry;

  // Debug printout for environment and mode
  console.log('[Lex Webpack] NODE_ENV:', process.env.NODE_ENV);
  console.log('[Lex Webpack] isProduction:', isProduction);
  console.log('[Lex Webpack] cliMode:', cliMode);

  const webpackConfig = {
    bail: true,
    cache: !isProduction,
    devtool: isProduction
      ? 'inline-cheap-module-source-map'
      : 'eval-cheap-module-source-map',
    entry: entryValue
      ? {
        index: [
          'buffer',
          'process/browser',
          entryValue
        ]
      }
      : {
        index: [
          'buffer',
          'process/browser',
          `${sourceFullPath}/${lexConfig.entryJs}`
        ]
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
          exclude: [
            /[\\/]websocket\.js$/,
            /[\\/]websocket.*\.js$/
          ],
          type: 'javascript/auto'
        },
        {
          test: /[\\/]websocket(.*)?\.js$/,
          include: /node_modules/,
          use: {
            loader: swcLoaderPath,
            options: {
              jsc: {
                parser: {
                  syntax: 'ecmascript',
                  dynamicImport: true,
                  importAssertions: true
                },
                target: 'es2020',
                transform: {
                  legacyDecorator: false,
                  decoratorMetadata: false
                }
              },
              module: {
                type: 'es6',
                strict: false,
                strictMode: true,
                lazy: false,
                noInterop: true
              },
              minify: false,
              sourceMaps: false
            }
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
            /node_modules\/(?!(react-native))/,
            `${sourceFullPath}/**/*.test.js*`,
            `${sourceFullPath}/**/*.test.ts*`
          ],
          include: sourceFullPath,
          type: 'javascript/esm',
          loader: swcLoaderPath,
          options: {
            ...LexConfig.config.swc,
            jsc: {
              ...LexConfig.config.swc?.jsc,
              parser: {
                ...LexConfig.config.swc?.jsc?.parser,
                tsx: false,
                dynamicImport: true
              },
              target: LexConfig.config.swc?.jsc?.target || 'es2020'
            },
            module: {
              ...LexConfig.config.swc?.module,
              type: 'es6'
            }
          },
          resolve: {
            symlinks: true
          },
          test: /\.(ts|js)$/
        },
        {
          exclude: [
            /node_modules\/(?!(react-native))/,
            `${sourceFullPath}/**/*.test.js*`,
            `${sourceFullPath}/**/*.test.ts*`
          ],
          include: sourceFullPath,
          type: 'javascript/esm',
          loader: swcLoaderPath,
          options: {
            ...LexConfig.config.swc
          },
          resolve: {
            symlinks: true
          },
          test: /\.tsx$/
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
                    '...',
                    {
                      tag: 'link',
                      attribute: 'href',
                      type: 'src',
                      filter: (tag, attribute, attributes) => {
                        const href = attributes[attribute];
                        return !href || !href.match(/\.(ico|png|jpg|jpeg|gif|svg|json)$/);
                      }
                    },
                    {
                      tag: 'script',
                      attribute: 'src',
                      type: 'src',
                      filter: (tag, attribute, attributes) => {
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
            ...(isProduction && isWeb
              ? [{
                loader: require(miniCssExtractPluginPath).loader
              }]
              : [styleLoaderPath]),
            {
              loader: cssLoaderPath,
              options: {
                importLoaders: 1,
                url: {
                  filter: (url, resourcePath) => {
                    if(url.startsWith('/')) {
                      return false;
                    }

                    return true;
                  }
                }
              }
            },
            {
              loader: postcssLoaderPath,
              options: {
                postcssOptions: {
                  plugins: [
                    postcssImport({
                      addDependencyTo: webpack,
                      path: [relativeNodePath('', dirName)]
                    }),
                    postcssUrl({
                      // Skip processing absolute URLs (starting with /) - let them pass through as-is
                      filter: (asset) => {
                        const url = asset.url || '';
                        // If URL starts with /, it's an absolute path - don't process it
                        if(url.startsWith('/')) {
                          return false;
                        }
                        // Process relative URLs
                        return true;
                      }
                    }),
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
                    tailwindNesting(),
                    postcssNesting(),
                    tailwindcss(),
                    autoprefixer(),
                    postcssFlexbugsFixes(),
                    postcssPresetEnv({
                      stage: 0
                    }),
                    ...(isProduction ? [cssnano({autoprefixer: false})] : []),
                    postcssBrowserReporter()
                  ]
                }
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
          test: /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|ogg|mp3|wav|flac|aac)$/,
          include: staticPathFull,
          type: 'asset/resource',
          generator: {
            filename: '[name].[hash][ext]'
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
          test: /\.json$/,
          type: 'json'
        },
        {
          test: /\.ico$/,
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
            new CssMinimizerPlugin()
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
      publicPath: '/',
      environment: {
        module: true
      }
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
      extensionAlias: {
        '.js': ['.ts', '.tsx', '.js', '.jsx'],
        '.jsx': ['.tsx', '.jsx']
      },
      fallback: {
        assert: relativeNodePath('assert', dirName),
        buffer: relativeNodePath('buffer', dirName),
        crypto: relativeNodePath('crypto-js', dirName),
        http: relativeNodePath('stream-http', dirName),
        https: relativeNodePath('https-browserify', dirName),
        os: relativeNodePath('os-browserify/browser.js', dirName),
        path: relativeNodePath('path-browserify', dirName),
        process: relativeNodePath('process/browser.js', dirName),
        randombytes: relativeNodePath('randombytes', dirName),
        stream: relativeNodePath('stream-browserify', dirName),
        util: relativeNodePath('util', dirName),
        vm: relativeNodePath('vm-browserify', dirName),
        Buffer: relativeNodePath('buffer', dirName)
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
            {
              from: '/wps',
              to: ({parsedUrl: {pathname}}) => pathname
            },
            {
              from: /\.js/,
              to: ({parsedUrl: {pathname}}) => {
                const pathUrl = pathname.split('/');
                const fileIndex = pathUrl.length > 1 ? pathUrl.length - 1 : 0;
                return `/${pathUrl[fileIndex]}`;
              }
            }
          ],
          verbose: !(process.env.LEX_QUIET === 'true')
        },
        hmr: false,
        log: {level: 'trace'},
        middleware: (app, builtins) => {
          const koaStatic = require('koa-static');
          const {readFileSync} = require('fs');

          app.use(async (ctx, next) => {
            const path = ctx.path || ctx.url || '';
            const isStaticFile = path && /\.(css|gif|ico|jpg|jpeg|json|png|svg|txt|woff|woff2|ttf|eot)$/i.test(path);

            if(isStaticFile && outputFullPath) {
              const filePath = pathResolve(outputFullPath, path.replace(/^\//, ''));
              if(existsSync(filePath)) {
                try {
                  ctx.type = path.match(/\.svg$/i) ? 'image/svg+xml' :
                    path.match(/\.(jpg|jpeg|png|gif)$/i) ? `image/${path.split('.').pop()}` :
                      path.match(/\.css$/i) ? 'text/css' :
                        'application/octet-stream';
                  ctx.body = readFileSync(filePath);
                  ctx.status = 200;

                  return;
                } catch(err) {
                  if(process.env.LEX_CONFIG_DEBUG) {
                    console.log(`[LEX_DEBUG] Error reading file ${filePath}:`, err.message);
                  }
                }
              } else {
                if(process.env.LEX_CONFIG_DEBUG) {
                  console.log(`[LEX_DEBUG] File not found at: ${filePath}, outputFullPath: ${outputFullPath}, path: ${path}`);
                }
              }
            }

            await next();
          });

          if(outputFullPath && existsSync(outputFullPath)) {
            if(process.env.LEX_CONFIG_DEBUG) {
              console.log(`[LEX_DEBUG] Setting up static file serving from output: ${outputFullPath}`);
            }

            app.use(koaStatic(outputFullPath, {
              index: false,
              defer: false,
              hidden: false,
              gzip: true,
              br: false
            }));
          }

          if(existsSync(staticPathFull)) {
            if(process.env.LEX_CONFIG_DEBUG) {
              console.log(`[LEX_DEBUG] Setting up static file serving from: ${staticPathFull}`);
            }

            app.use(koaStatic(staticPathFull, {
              index: false, // Don't auto-serve index files
              defer: false, // CRITICAL: Don't defer - serve immediately if file exists
              hidden: false,
              gzip: true,
              br: false
            }));

            if(process.env.LEX_CONFIG_DEBUG) {
              app.use(async (ctx, next) => {
                const path = ctx.path || ctx.url || '';
                if(path && !path.match(/^\/wps/) && !path.match(/^\/webpack/)) {
                  console.log(`[LEX_DEBUG] Request: ${path}`);
                }
                await next();
                if(ctx.status === 404 && path && path.includes('.')) {
                  console.log(`[LEX_DEBUG] 404 for: ${path}, body set: ${ctx.body !== undefined}`);
                }
              });
            }
          } else {
            if(process.env.LEX_CONFIG_DEBUG) {
              console.log(`[LEX_DEBUG] Static path does not exist: ${staticPathFull}`);
            }
          }

          app.use(async (ctx, next) => {
            const path = ctx.path || ctx.url || '';
            const isStaticFile = path && /\.(css|gif|ico|jpg|jpeg|json|png|svg|txt|woff|woff2|ttf|eot)$/i.test(path);

            await next();

            if(isStaticFile && ctx.status === 404) {
              ctx.body = 'File not found';
              return;
            }
          });

          app.use(async (ctx, next) => {
            const path = ctx.path || ctx.url || (ctx.request && ctx.request.path) || '';
            if(path && path.match(/^\/wps/)) {
              const {accept, Accept, ...remainingHeaders} =
                ctx.request.header;
              ctx.request.header = remainingHeaders;
            }
            await next();
          });
        },
        open: process.env.WEBPACK_DEV_OPEN === 'true',
        port: finalPort,
        progress: 'minimal',
        static: outputFullPath ? [outputFullPath] : [],
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
      webpackConfig.watchOptions = {
        aggregateTimeout: 500,
        ignored: ['node_modules/**', ...watchIgnorePaths]
      };
    }
  } else {
    // In production, extract CSS to separate files for injection into HTML
    if(isProduction && isWeb) {
      const MiniCssExtractPlugin = require(miniCssExtractPluginPath);
      plugins.push(
        new MiniCssExtractPlugin({
          filename: outputHash ? 'css/[name].[contenthash].css' : 'css/[name].css',
          chunkFilename: outputHash ? 'css/[name].[contenthash].chunk.css' : 'css/[name].chunk.css'
        })
      );
      webpackConfig.optimization.moduleIds = 'deterministic';
    }

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
  }

  if(process.env.LEX_CONFIG_DEBUG) {
    console.log('\n\x1b[36m[LEX_CONFIG_DEBUG] Webpack mode:', process.env.NODE_ENV, 'isProduction:', isProduction, '\x1b[0m');
    if(webpackConfig && webpackConfig.module && Array.isArray(webpackConfig.module.rules)) {
      console.log('\x1b[36m[LEX_CONFIG_DEBUG] Loader chains:\x1b[0m');
      webpackConfig.module.rules.forEach((rule, idx) => {
        if(rule.test) {
          const testStr = rule.test.toString();
          let use = rule.use || rule.loader || rule.type;
          if(Array.isArray(use)) {
            use = use.map((u) => (typeof u === 'string' ? u : u.loader || u.type)).join(' -> ');
          } else if(typeof use === 'object' && use !== null) {
            use = use.loader || use.type;
          }
          console.log(`  [${idx}] ${testStr}: ${use}`);
        }
      });
    }

    if(webpackConfig && Array.isArray(webpackConfig.plugins)) {
      console.log('\x1b[36m[LEX_CONFIG_DEBUG] Plugins:\x1b[0m');
      webpackConfig.plugins.forEach((plugin, idx) => {
        let name = plugin.constructor && plugin.constructor.name;
        if(!name && typeof plugin === 'object' && plugin.apply) {
          name = 'CustomPlugin';
        }
        if(!name && typeof plugin === 'function') {
          name = 'FunctionPlugin';
        }
        console.log(`  [${idx}] ${name}`);
      });
    }

    if(webpackConfig && webpackConfig.module && Array.isArray(webpackConfig.module.rules)) {
      const cssRule = webpackConfig.module.rules.find((rule) => rule.test && rule.test.toString().includes('css'));
      if(cssRule) {
        let use = cssRule.use || cssRule.loader || cssRule.type;
        if(Array.isArray(use)) {
          use = use.map((u) => (typeof u === 'string' ? u : u.loader || u.type)).join(' -> ');
        } else if(typeof use === 'object' && use !== null) {
          use = use.loader || use.type;
        }
        console.log('\x1b[36m[LEX_CONFIG_DEBUG] CSS Loader Chain:\x1b[0m', use);
      } else {
        console.log('\x1b[36m[LEX_CONFIG_DEBUG] No CSS loader rule found.\x1b[0m');
      }
    }
  }

  const mergedConfig = merge(webpackConfig, webpackConfigFiltered);

  if(Array.isArray(mergedConfig.plugins)) {
    mergedConfig.plugins = mergedConfig.plugins.filter((plugin) => {
      if(typeof plugin === 'function' || (plugin && typeof plugin.apply === 'function')) {
        return true;
      }

      if(plugin && typeof plugin === 'object' && 'postcssPlugin' in plugin) {
        return false;
      }

      return true;
    });
  }

  return mergedConfig;
};