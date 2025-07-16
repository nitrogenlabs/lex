import type { StorybookConfig } from '@storybook/react-webpack5';
import { dirname, resolve } from 'path';

const getLexNodeModulesPath = () => {
  const lexPackageRoot = dirname(__dirname); // Go up from .storybook to lex root
  return resolve(lexPackageRoot, 'node_modules');
};

const lexModule = (modulePath: string) => resolve(getLexNodeModulesPath(), modulePath);

const config: StorybookConfig = {
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
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  webpackFinal: async (config) => ({
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
        }
      ]
    },
    resolve: {
      ...config.resolve,
      extensions: ['.js', '.ts', '.tsx'],
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
      })
    ],
    stats: 'verbose'
  })
};

export default config;