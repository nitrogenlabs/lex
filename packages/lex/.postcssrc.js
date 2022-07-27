/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
const path = require('path');
const {relativeFilePath} = require('./dist/utils/file');
const pluginPath = relativeFilePath('postcss-cli', path.resolve(__dirname, './node_modules'));
const nodePath = path.resolve(pluginPath, '../');

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
      require(`${nodePath}/autoprefixer`),
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