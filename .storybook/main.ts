const config = {
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-links',
    '@storybook/addon-postcss',
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
  stories: ['../src/**/*.stories.@(js|ts|tsx)', '../src/**/*.mdx']
};

export default config;