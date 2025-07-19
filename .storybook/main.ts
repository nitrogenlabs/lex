const config = {
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-links',
    '@storybook/addon-postcss',
    {
      name: '@storybook/addon-styling-webpack',
      options: {
        rules: [
          {
            test: /\.css$/,
            use: [
              'style-loader',
              'css-loader',
              {
                loader: 'postcss-loader',
                options: {
                  postcssOptions: {
                    config: 'node_modules/@nlabs/lex/postcss.config.js',
                  },
                },
              }
            ]
          }
        ]
      }
    },
    '@storybook/addon-themes'
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {
      builder: {
        useSWC: true
      },
    }
  },
  stories: ['../src/**/*.stories.@(js|ts|tsx)', '../src/**/*.mdx'],
  webpackFinal: async (config) => {
    return {
      ...config,
      module: {
        ...config.module,
        rules: [
          ...(config.module?.rules || []),
          {
            test: /\.(ts|tsx)$/,
            use: [
              {
                loader: 'babel-loader',
                options: {
                  presets: [
                    '@babel/preset-typescript',
                    [
                      '@babel/preset-react',
                      {
                        runtime: 'automatic'
                      }
                    ]
                  ]
                }
              }
            ]
          }
        ]
      },
      resolve: {
        ...config.resolve,
        extensions: ['.js', '.ts', '.tsx', '.json', '.mdx'],
        extensionAlias: {
          '.js': ['.ts', '.tsx', '.js']
        }
      }
    };
  }
};

export default config;