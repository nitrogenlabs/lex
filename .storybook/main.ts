import {resolve} from 'path';

const lexModule = (modulePath: string) => resolve('/Users/nitrog7/Development/lex/node_modules', modulePath);

const config = {
  addons: [
    lexModule('@storybook/addon-docs'),
    lexModule('@storybook/addon-links'),
    lexModule('@storybook/addon-themes')
  ],
  framework: {
    name: lexModule('@storybook/react-webpack5'),
    options: {
      builder: {
        useSWC: true
      }
    }
  },
  stories: ['/Users/nitrog7/Development/lex/src/**/*.stories.@(ts|tsx)', '/Users/nitrog7/Development/lex/src/**/*.mdx'],
  webpackFinal: async (config) => {
    const isVerbose = process.env.LEX_VERBOSE === 'true';

    return {
      ...config,
      module: {
        ...config.module,
        rules: [
          ...(config.module?.rules || []),
          {
            loader: lexModule('babel-loader/lib/index.js'),
            options: {
              babelrc: false,
              plugins: [
                ['@babel/plugin-transform-nullish-coalescing-operator'],
                ['@babel/plugin-transform-optional-chaining']
              ],
              presets: [
                '@babel/preset-typescript',
                [
                  '@babel/preset-react',
                  {
                    runtime: 'automatic'
                  }
                ]
              ]
            },
            test: /\.(ts|tsx)$/
          },
          {
            test: /\.css$/,
            use: [
              lexModule('style-loader'),
              lexModule('css-loader'),
              {
                loader: lexModule('postcss-loader'),
                options: {
                  postcssOptions: {
                    config: true
                  }
                }
              }
            ]
          }
        ]
      },
      resolve: {
        ...config.resolve,
        extensions: ['.js', '.ts', '.tsx', '.css', '.scss'],
        plugins: [
          ...(config.resolve?.plugins || [])
        ],
        fallback: {
          ...config.resolve?.fallback,
          "process": require.resolve("process/browser"),
          "buffer": require.resolve("buffer"),
          "util": require.resolve("util"),
          "stream": require.resolve("stream-browserify"),
          "crypto": require.resolve("crypto-browserify"),
          "path": require.resolve("path-browserify"),
          "os": require.resolve("os-browserify/browser"),
          "vm": require.resolve("vm-browserify"),
          "fs": false,
          "net": false,
          "tls": false
        }
      },
      plugins: [
        ...(config.plugins || []),
        new (require('webpack')).ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer']
        }),
        new (require('webpack')).DefinePlugin({
          'process.env.TAILWIND_CSS_PATH': JSON.stringify(process.env.TAILWIND_CSS_PATH),
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
          'process.env.LEX_VERBOSE': JSON.stringify(process.env.LEX_VERBOSE),
          'process.env.STORYBOOK_ENV': JSON.stringify('development')
        })
      ],
      stats: isVerbose ? 'verbose' : 'errors-only'
    };
  }
};

export default config;