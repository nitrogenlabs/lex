/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {existsSync, readFileSync} from 'fs';
import isPlainObject from 'lodash/isPlainObject.js';
import {resolve as pathResolve} from 'path';


import {FaviconsPluginOptions} from './types/main.ts';
import {compileTemplate} from './utils/compiler.ts';

import type {Compiler} from 'webpack';

const defaultOptions = {
  background: '#fff',
  emitStats: false,
  icons: {
    android: true,
    appleIcon: true,
    appleStartup: true,
    coast: false,
    favicons: true,
    firefox: true,
    opengraph: false,
    twitter: false,
    windows: false,
    yandex: false
  },
  inject: true,
  persistentCache: true,
  prefix: 'icons-[hash]/',
  statsFilename: 'iconstats-[hash].json'
};

export class FaviconsPlugin {
  options: FaviconsPluginOptions;

  constructor(options: FaviconsPluginOptions) {
    if(isPlainObject(options)) {
      const {icons: optionIcons = {}, logo} = options;

      if(!logo) {
        throw new Error('FaviconsPlugin Error: "logo" property is required');
      } else {
        const icons = Object.keys(defaultOptions.icons).reduce(
          (list, iconName: string) => {
            list[iconName] = optionIcons[iconName] !== undefined ? optionIcons[iconName] : defaultOptions.icons[iconName];
            return list;
          },
          {}
        );

        this.options = {...defaultOptions, ...options, icons};
      }
    } else {
      throw new Error('FaviconsPlugin Error: "options" must be an object');
    }
  }

  /**
   * Tries to guess the name from the package.json
   */
  static getAppName(compilerWorkingDirectory: string): string {
    const packageJson: string = pathResolve(compilerWorkingDirectory, 'package.json');

    if(!existsSync(packageJson)) {
      const parentPackageJson: string = pathResolve(compilerWorkingDirectory, '../package.json');

      if(!existsSync(parentPackageJson)) {
        return 'Webpack App';
      }

      return JSON.parse(readFileSync(parentPackageJson).toString()).name;
    }

    return JSON.parse(readFileSync(packageJson).toString()).name;
  }

  apply(compiler: Compiler): void {
    const {emitStats, inject, title} = this.options;

    if(!title) {
      this.options = {...this.options, title: FaviconsPlugin.getAppName(compiler.context)};
    }

    // Generate the favicons
    let compilationResult;

    compiler.hooks.make.tapAsync('FaviconsPluginMake', (compilation, callback) => {
      compileTemplate(this.options, compiler.context, compilation)
        .then((result) => {
          compilationResult = result;
          callback();
        })
        .catch(callback);
    });

    // Hook into the html-webpack-plugin processing and add the html
    if(inject) {
      compiler.hooks.compilation.tap('FaviconsPlugin', (compilation) => {
        // HtmlWebpackPlugin 4.x
        try {
          const HtmlWebpackPlugin = require('html-webpack-plugin');
          const hooks = HtmlWebpackPlugin.getHooks(compilation);

          hooks.beforeEmit.tapAsync('favicons-webpack-plugin', (data, cb) => {
            if(data.plugin.options.favicons === true) {
              data.html = data.html.replace(/(<\/head>)/i, `${compilationResult.stats.html.join('')}$&`);
            }
            cb(null, data);
          });
        } catch(_error) {
          // For older versions or when HtmlWebpackPlugin is not available
          // This is a fallback that will show a more helpful error
          throw new Error('FaviconsPlugin Error: This version requires html-webpack-plugin 4.x or higher.');
        }
      });
    }

    // Remove the stats from the output if they are not required
    if(!emitStats) {
      compiler.hooks.emit.tapAsync('FaviconsPluginEmit', (compilation, callback) => {
        delete compilation.assets[compilationResult.outputName];
        callback();
      });
    }
  }
}
