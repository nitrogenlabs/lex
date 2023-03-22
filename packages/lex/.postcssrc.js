/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import postcssBrowserReporter from 'postcss-browser-reporter';
import postcssCustomProperties from 'postcss-custom-properties';
import postcssFlexbugsFixes from 'postcss-flexbugs-fixes';
import postcssFor from 'postcss-for';
import postcssImport from 'postcss-import';
import postcssNesting from 'postcss-nesting';
import postcssPercentage from 'postcss-percentage';
import postcssPresetEnv from 'postcss-preset-env';
import postcssUrl from 'postcss-url';
import {fileURLToPath} from 'url';

const config = {
  plugins: [
    postcssImport,
    postcssUrl,
    postcssFor,
    postcssPercentage({
      floor: true,
      precision: 9,
      trimTrailingZero: true
    }),
    postcssCustomProperties({
      preserve: false,
      strict: false,
      warnings: false
    }),
    autoprefixer,
    postcssNesting,
    postcssFlexbugsFixes,
    postcssPresetEnv({
      browsers: ['last 5 versions'],
      stage: 0
    }),
    cssnano({autoprefixer: false}),
    postcssBrowserReporter
  ]
}

export default config;
