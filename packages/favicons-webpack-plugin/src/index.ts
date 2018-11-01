/**
 * Copyright (c) 2018, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import fs from 'fs';
import isPlainObject from 'lodash/isPlainObject';
import path from 'path';

import {FaviconsPluginOptions} from './types/main';
import {compileTemplate} from './utils/compiler';

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
            list[iconName] = optionIcons[iconName] || false;
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
  static getAppName(compilerWorkingDirectory): string {
    const packageJson: string = path.resolve(compilerWorkingDirectory, 'package.json');

    if(!fs.existsSync(packageJson)) {
      const parentPackageJson: string = path.resolve(compilerWorkingDirectory, '../package.json');

      if(!fs.existsSync(parentPackageJson)) {
        return 'Webpack App';
      }
    }

    return JSON.parse(fs.readFileSync(packageJson).toString()).name;
  }

  apply(compiler) {
    const {emitStats, inject, title} = this.options;

    console.log('FaviconsPlugin::apply::1::title', title, FaviconsPlugin.getAppName(compiler.context));
    if(!title) {
      this.options = {...this.options, title: FaviconsPlugin.getAppName(compiler.context)};
    }
    console.log('FaviconsPlugin::apply::2');
    // Generate the favicons (webpack 4 compliant + back compat)
    let compilationResult;

    compiler.hooks.make.tapAsync.bind(compiler.hooks.make, 'FaviconsPluginMake')((compilation, callback) => {
      compileTemplate(this.options, compiler.context, compilation)
        .then((result) => {
          console.log('FaviconsPlugin::apply::2a');
          compilationResult = result;
          callback();
        })
        .catch(callback);
    });

    console.log('FaviconsPlugin::apply::3::inject', inject);
    // Hook into the html-webpack-plugin processing and add the html
    if(inject) {
      const addFaviconsToHtml = (htmlPluginData, callback): void => {
        if(htmlPluginData.plugin.options.favicons === true) {
          htmlPluginData.html = htmlPluginData.html
            .replace(/(<\/head>)/i, `${compilationResult.stats.html.join('')}$&`);
        }

        callback(null, htmlPluginData);
      };

      compiler.hooks.compilation.tap('FaviconsPlugin', (cmpp) => {
        console.log('FaviconsPlugin::apply::3a');
        if(cmpp.hooks.htmlWebpackPluginBeforeHtmlProcessing) {
          cmpp.hooks.htmlWebpackPluginBeforeHtmlProcessing.tapAsync('favicons-webpack-plugin', addFaviconsToHtml);
        } else {
          throw new Error('FaviconsPlugin Error: HTMLWebpackPlugin has not been included.');
        }
      });
    }

    console.log('FaviconsPlugin::apply::4::emitStats', emitStats);
    // Remove the stats from the output if they are not required (webpack 4 compliant + back compat)
    if(!emitStats) {
      console.log('FaviconsPlugin::apply::4a');
      compiler.hooks.emit.tapAsync.bind(compiler.hooks.emit, 'FaviconsPluginEmit')((compilation, callback) => {
        console.log('FaviconsPlugin::apply::4b');
        delete compilation.assets[compilationResult.outputName];
        callback();
      });
    }

    console.log('FaviconsPlugin::apply::5');
  }
}
