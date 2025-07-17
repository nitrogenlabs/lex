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
                    '/Users/nitrog7/Development/gothamjs/node_modules/@babel/preset-typescript',
                    [
                      '/Users/nitrog7/Development/gothamjs/node_modules/@babel/preset-react',
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
      }
    };
  }
};

export default config;