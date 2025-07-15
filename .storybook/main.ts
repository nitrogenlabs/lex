import type {StorybookConfig} from '@storybook/react-webpack5';
import {dirname, resolve} from 'path';

// Dynamically resolve the Lex package's node_modules
function getLexNodeModulesPath() {
  // Since this config is now inside Lex's directory, we can use __dirname
  // to find the Lex package root and then navigate to node_modules
  const lexPackageRoot = dirname(dirname(__dirname)); // Go up from .storybook to packages/lex to packages
  return resolve(lexPackageRoot, 'lex', 'node_modules');
}

function lexModule(modulePath: string) {
  return resolve(getLexNodeModulesPath(), modulePath);
}

const config: StorybookConfig = {
  addons: [
    lexModule('@storybook/addon-links'),
    lexModule('@storybook/addon-essentials'),
    lexModule('@storybook/addon-interactions'),
    lexModule('@storybook/addon-styling'),
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
      ]
    },
    stats: 'verbose'
  })
};

export default config;