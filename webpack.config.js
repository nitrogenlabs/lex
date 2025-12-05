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
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';
import {existsSync} from 'fs';
import {sync as globSync} from 'glob';
import HtmlWebPackPlugin from 'html-webpack-plugin';
import isEmpty from 'lodash/isEmpty.js';
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

import {relativeFilePath, relativeNodePath} from './lib/utils/file.js';
import {LexConfig} from './lib/LexConfig.js';
import postcssFor from './lib/utils/postcss/postcss-for.js';
import postcssPercentage from './lib/utils/postcss/postcss-percentage.js';

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

const webpackStaticPath = webpackCustom?.staticPath || './src/static';

const { publicPath: _, ...webpackConfigFiltered } = webpackCustom || {};

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
    'global': 'global'
  }),
  {
    apply: (compiler) => {
      compiler.hooks.watchRun.tap('NotifyOnRebuild', () => {
        console.log('\x1b[36m[webpack]\x1b[0m Detected file change. Rebuilding...');
      });
      compiler.hooks.done.tap('NotifyOnRebuild', (stats) => {
        if (stats.hasErrors()) {
          console.log('\x1b[31m[webpack]\x1b[0m Build failed with errors.');
        } else {
          console.log('\x1b[32m[webpack]\x1b[0m Build complete. Watching for changes...');
        }
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

const staticPathFull = pathResolve(process.cwd(), webpackStaticPath);
if(existsSync(staticPathFull)) {
  staticPaths.push({
    from: staticPathFull,
    to: './'
  });
  watchIgnorePaths.push(staticPathFull);
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
      template: `${sourceFullPath}/${lexConfig.entryHTML}`,
      inject: true
    })
  );

  const missingAssets = [];
  const requiredAssets = ['favicon.ico', 'images/logo-icon-64.png', 'manifest.json'];

  requiredAssets.forEach(asset => {
    if (!existsSync(`${sourceFullPath}/${asset}`)) {
      missingAssets.push(asset);
    }
  });

  if (missingAssets.length > 0) {
    plugins.push(
      new CopyWebpackPlugin({
        patterns: missingAssets.map(asset => ({
          from: pathResolve(dirName, 'emptyModule.js'),
          to: `${outputFullPath}/${asset}`,
          transform() {
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

const swcLoaderPath = relativeNodePath('swc-loader', dirName);
const cssLoaderPath = relativeNodePath('css-loader', dirName);
const graphqlLoaderPath = relativeNodePath('graphql-tag/loader', dirName);
const htmlLoaderPath = relativeNodePath('html-loader', dirName);
const postcssLoaderPath = relativeNodePath('postcss-loader', dirName);
const sourceMapLoaderPath = relativeNodePath('source-map-loader', dirName);
const styleLoaderPath = relativeNodePath('style-loader', dirName);
const webpackPath = relativeNodePath('webpack', dirName);

const aliasPaths = {
  '@nlabs/arkhamjs': relativeNodePath('@nlabs/arkhamjs', process.cwd()),
  '@nlabs/arkhamjs-utils-react': relativeNodePath('@nlabs/arkhamjs-utils-react', process.cwd()),
  'buffer': relativeNodePath('buffer', dirName),
  'core-js': relativeNodePath('core-js', dirName),
  process: relativeNodePath('process', dirName),
  react: relativeNodePath('react', process.cwd()),
  'react-dom': relativeNodePath('react-dom', process.cwd()),
  'regenerator-runtime': relativeNodePath('regenerator-runtime', dirName),
  'Buffer': relativeNodePath('buffer', dirName)
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
          loader: swcLoaderPath,
          options: {
            ...LexConfig.config.swc,
            jsc: {
              ...LexConfig.config.swc?.jsc,
              parser: {
                ...LexConfig.config.swc?.jsc?.parser,
                tsx: false
              }
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
          loader: swcLoaderPath,
          options: {
            ...LexConfig.config.swc,
            jsc: {
              ...LexConfig.config.swc?.jsc,
              parser: {
                ...LexConfig.config.swc?.jsc?.parser,
                tsx: true
              },
              transform: {
                ...LexConfig.config.swc?.jsc?.transform,
                react: {
                  ...LexConfig.config.swc?.jsc?.transform?.react,
                  runtime: 'automatic'
                }
              }
            }
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
                    postcssImport({
                      addDependencyTo: webpack,
                      path: [relativeNodePath('', dirName)]
                    }),
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
            },
            {
              from: /\\.(css|gif|ico|jpg|json|png|svg)$/,
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
        port: port || 3000,
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
      webpackConfig.watchOptions = {
        aggregateTimeout: 500,
        ignored: ['node_modules/**', ...watchIgnorePaths]
      };
    }
  } else {
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

  if (process.env.LEX_CONFIG_DEBUG) {
    console.log('\n\x1b[36m[LEX_CONFIG_DEBUG] Webpack mode:', process.env.NODE_ENV, 'isProduction:', isProduction, '\x1b[0m');
    if (webpackConfig && webpackConfig.module && Array.isArray(webpackConfig.module.rules)) {
      console.log('\x1b[36m[LEX_CONFIG_DEBUG] Loader chains:\x1b[0m');
      webpackConfig.module.rules.forEach((rule, idx) => {
        if (rule.test) {
          let testStr = rule.test.toString();
          let use = rule.use || rule.loader || rule.type;
          if (Array.isArray(use)) {
            use = use.map(u => (typeof u === 'string' ? u : u.loader || u.type)).join(' -> ');
          } else if (typeof use === 'object' && use !== null) {
            use = use.loader || use.type;
          }
          console.log(`  [${idx}] ${testStr}: ${use}`);
        }
      });
    }

    if (webpackConfig && Array.isArray(webpackConfig.plugins)) {
      console.log('\x1b[36m[LEX_CONFIG_DEBUG] Plugins:\x1b[0m');
      webpackConfig.plugins.forEach((plugin, idx) => {
        let name = plugin.constructor && plugin.constructor.name;
        if (!name && typeof plugin === 'object' && plugin.apply) name = 'CustomPlugin';
        if (!name && typeof plugin === 'function') name = 'FunctionPlugin';
        console.log(`  [${idx}] ${name}`);
      });
    }

    if (webpackConfig && webpackConfig.module && Array.isArray(webpackConfig.module.rules)) {
      const cssRule = webpackConfig.module.rules.find(rule => rule.test && rule.test.toString().includes('css'));
      if (cssRule) {
        let use = cssRule.use || cssRule.loader || cssRule.type;
        if (Array.isArray(use)) {
          use = use.map(u => (typeof u === 'string' ? u : u.loader || u.type)).join(' -> ');
        } else if (typeof use === 'object' && use !== null) {
          use = use.loader || use.type;
        }
        console.log('\x1b[36m[LEX_CONFIG_DEBUG] CSS Loader Chain:\x1b[0m', use);
      } else {
        console.log('\x1b[36m[LEX_CONFIG_DEBUG] No CSS loader rule found.\x1b[0m');
      }
    }
  }

  const mergedConfig = merge(webpackConfig, webpackConfigFiltered);

  // Filter out PostCSS plugin objects from webpack plugins array
  // PostCSS plugins have 'postcssPlugin' property and should only be in postcssOptions
  if (Array.isArray(mergedConfig.plugins)) {
    mergedConfig.plugins = mergedConfig.plugins.filter((plugin) => {
      // Keep webpack plugins (have 'apply' method or are instances with constructor)
      if (typeof plugin === 'function' || (plugin && typeof plugin.apply === 'function')) {
        return true;
      }
      // Filter out PostCSS plugin objects (have 'postcssPlugin' property)
      if (plugin && typeof plugin === 'object' && 'postcssPlugin' in plugin) {
        return false;
      }
      // Keep other valid webpack plugins
      return true;
    });
  }

  return mergedConfig;
};