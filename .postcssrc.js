const path = require('path');
const nodePath = path.resolve(__dirname, './node_modules');

module.exports = {
  plugins: [
      require(`${nodePath}/postcss-import`),
      require(`${nodePath}/postcss-url`),
      require(`${nodePath}/postcss-for`),
      require(`${nodePath}/postcss-percentage`)({
        floor: true,
        precision: 9,
        trimTrailingZero: true
      }),
      require(`${nodePath}/postcss-custom-properties`)({
        preserve: false,
        strict: false,
        warnings: false
      }),
      require(`${nodePath}/postcss-simple-vars`),
      require(`${nodePath}/postcss-nesting`),
      require(`${nodePath}/postcss-flexbugs-fixes`),
      require(`${nodePath}/postcss-preset-env`)({
        browsers: ['last 5 versions'],
        stage: 0
      }),
      require(`${nodePath}/cssnano`)({autoprefixer: false}),
      require(`${nodePath}/postcss-browser-reporter`)
    ]
}