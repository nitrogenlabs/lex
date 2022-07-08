/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import cheerio from 'cheerio';
import evaluate from 'eval';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isPlainObject from 'lodash/isPlainObject';
import path from 'path';
import url from 'url';
import RawSource from 'webpack-sources/lib/RawSource';

import {StaticSitePluginOptions, StaticSiteRenderPaths} from './types/main';

const defaultOptions = {
  crawl: true,
  entry: '',
  globals: {},
  locals: {},
  paths: ['/']
};

export class StaticSitePlugin {
  options: StaticSitePluginOptions;

  constructor(options: StaticSitePluginOptions = {}) {
    if(isPlainObject(options)) {
      this.options = {...defaultOptions, ...options};
    } else {
      throw new Error('StaticSitePlugin Error: "options" must be an object');
    }
  }

  static renderPaths(options: StaticSiteRenderPaths): Promise<any> {
    const {
      assets,
      compilation,
      crawl,
      paths,
      render,
      userLocals,
      webpackStats
    } = options;
    console.log('paths', paths);
    let filePaths: any = paths;

    if(!isArray(filePaths)) {
      filePaths = [filePaths];
    }

    const renderPromises: Promise<any>[] = filePaths.map((outputPath: string) => {
      const locals = {assets, path: outputPath, webpackStats, ...userLocals};
      console.log('render', render.hasOwnProperty('then'), render.length);
      let renderPromise: Promise<any>;

      if(render.hasOwnProperty('then')) {
        renderPromise = render(locals);
      } else if(render.length < 2) {
        renderPromise = Promise.resolve(render(locals));
      } else {
        renderPromise = new Promise((resolve) => render(locals, resolve));
      }

      return renderPromise
        .then((output) => {
          const outputByPath: string = isPlainObject(output) ? output : StaticSitePlugin.makeObject(outputPath, output);
          const assetGenerationPromises: Promise<any>[] = Object.keys(outputByPath).map((key: string) => {
            const rawSource: string = outputByPath[key];
            const assetName: string = StaticSitePlugin.pathToAssetName(key);

            if(compilation.assets[assetName]) {
              return Promise.resolve(null);
            }

            compilation.assets[assetName] = new RawSource(rawSource);

            if(crawl) {
              const relativePaths = StaticSitePlugin.relativePathsFromHtml({path: key, source: rawSource}) as string[];
              const options: StaticSiteRenderPaths = {
                assets,
                compilation,
                crawl,
                relativePaths,
                render,
                userLocals,
                webpackStats
              };
              return StaticSitePlugin.renderPaths(options);
            }

            return Promise.resolve(null);
          });

          return Promise.all(assetGenerationPromises);
        })
        .catch((err) => {
          compilation.errors.push(err.stack);
        });
    });

    return Promise.all(renderPromises);
  }

  static findAsset(src: string, compilation, webpackStatsJson) {
    let updatedSrc: string = src;

    if(isEmpty(updatedSrc)) {
      const chunkNames = Object.keys(webpackStatsJson.assetsByChunkName);
      updatedSrc = chunkNames[0];
    }

    const asset = compilation.assets[updatedSrc];

    if(asset) {
      return asset;
    }

    let chunkValue = webpackStatsJson.assetsByChunkName[updatedSrc];

    if(!chunkValue) {
      return null;
    }

    // Webpack outputs an array for each chunk when using sourcemaps
    if(isArray(chunkValue)) {
      // Is the main bundle always the first element?
      chunkValue = chunkValue[0];
    }

    return compilation.assets[chunkValue];
  }

  // Shamelessly stolen from html-webpack-plugin - Thanks @ampedandwired :)
  static getAssetsFromCompilation(compilation, webpackStatsJson) {
    const assets = {};

    for(const chunk in webpackStatsJson.assetsByChunkName) {
      let chunkValue = webpackStatsJson.assetsByChunkName[chunk];

      // Webpack outputs an array for each chunk when using sourcemaps
      if(chunkValue instanceof Array) {
        // Is the main bundle always the first element?
        chunkValue = chunkValue[0];
      }

      if(compilation.options.output.publicPath) {
        chunkValue = compilation.options.output.publicPath + chunkValue;
      }

      assets[chunk] = chunkValue;
    }

    return assets;
  }

  static pathToAssetName(outputPath: string): string {
    let outputFileName: string = outputPath.replace(/^(\/|\\)/, ''); // Remove leading slashes for dev server

    if(!/\.(html?)$/i.test(outputFileName)) {
      outputFileName = path.join(outputFileName, 'index.html');
    }

    return outputFileName;
  }

  static makeObject(key: string, value: string) {
    return {[key]: value};
  }

  static relativePathsFromHtml(options) {
    const {source: html, path: currentPath} = options;
    const dom = cheerio.load(html);
    const linkHrefs: string[] = dom('a[href]').map((index: number, el) => dom(el).attr('href')).get();
    const iframeSrcs: string[] = dom('iframe[src]').map((index: number, el) => dom(el).attr('src')).get();

    return [...linkHrefs, ...iframeSrcs]
      .map((href: string) => {
        if(href.indexOf('//') === 0) {
          return null;
        }

        const parsed = url.parse(href);

        if(parsed.protocol || typeof parsed.path !== 'string') {
          return null;
        }

        return parsed.path.indexOf('/') === 0 ? parsed.path : url.resolve(currentPath, parsed.path);
      })
      .filter((href) => href !== null);
  }

  apply(compiler) {
    compiler.hooks.emit.tapPromise('afterCompile', (compilation) => {
      const webpackStats = compilation.getStats();
      const webpackStatsJson = webpackStats.toJson();
      const {crawl, entry, globals, locals, paths} = this.options;

      try {
        const asset = StaticSitePlugin.findAsset(entry as string, compilation, webpackStatsJson);

        if(asset === null) {
          throw new Error(`StaticSitePlugin Error: Source file not found, "${entry}"`);
        }

        const assets = StaticSitePlugin.getAssetsFromCompilation(compilation, webpackStatsJson);
        const source = asset.source();
        let render: any = evaluate(source, entry, globals, true);

        if(render.hasOwnProperty('default')) {
          render = render.default;
        }

        if(typeof render !== 'function') {
          throw new Error(`StaticSitePlugin Error: Export from "${entry}" must be a function that returns an HTML string. Is output.libraryTarget in the configuration set to "umd"?`);
        }

        return StaticSitePlugin.renderPaths({assets, compilation, crawl, locals, paths, render, webpackStats});
      } catch(error) {
        return Promise.reject(error);
      }
    });
  }
}
