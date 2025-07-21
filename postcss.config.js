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
import postcssHash from 'postcss-hash';
import postcssImport from 'postcss-import';
import postcssNesting from 'postcss-nesting';
import tailwindcss from '@tailwindcss/postcss';
import tailwindNesting from '@tailwindcss/nesting';
import postcssPercentage from 'postcss-percentage';
import postcssPresetEnv from 'postcss-preset-env';
import postcssSimpleVars from 'postcss-simple-vars';
import postcssSvgo from 'postcss-svgo';
import postcssUrl from 'postcss-url';
import {default as webpack} from 'webpack';

const config = {
  plugins: [
    postcssImport({addDependencyTo: webpack}),
    postcssUrl(),
    postcssFor(),
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
    tailwindNesting(),
    postcssNesting(),
    tailwindcss(),
    autoprefixer(),
    postcssFlexbugsFixes(),
    postcssPresetEnv({
      browsers: ['last 5 versions'],
      stage: 0
    }),
    cssnano({autoprefixer: false}),
    postcssBrowserReporter(),
    postcssSimpleVars(),
    postcssSvgo()
    // postcssHash({
    //   algorithm: 'md5',
    //   trim: 10,
    //   manifest: './build/manifest.json'
    // })
  ]
};

export default config;
