const config = {
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-links',
    '@storybook/addon-postcss',
    '@storybook/addon-styling-webpack',
    '@storybook/addon-themes'
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {
      builder: {
        useSWC: true
      }
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
      }
    };
  }
};

export default config;