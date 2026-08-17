const config = {
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-links',
    '@storybook/addon-themes'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  stories: ['../src/**/*.stories.@(js|ts|tsx)', '../src/**/*.mdx']
};

export default config;
