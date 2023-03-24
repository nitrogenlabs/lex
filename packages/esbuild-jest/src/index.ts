import {Format, Loader, TransformOptions, transformSync, transform} from 'esbuild';
import {basename as pathBasename, extname as pathExtname, resolve as pathResolve} from 'path';
import {rimraf, rimrafSync} from 'rimraf';

import {Options} from './options';
import {getExt, loaders} from './utils/file.js';

const createTransformer = (options?: Options) => ({
  async processAsync(content: string, filename: string, opts?: any) {
    const ext = getExt(filename);
    const extName = pathExtname(filename).slice(1);
    const tmpName = `${pathBasename(filename, extName)}.tmp.js`;
    const loaderName = extName.slice(1);
    const enableSourcemaps = options?.sourcemap || false;
    const loader = (options?.loaders?.[ext]
      ? options.loaders[ext]
      : loaders.includes(loaderName) ? loaderName : 'text'
    ) as Loader;
    const sourcemaps: Partial<TransformOptions> = enableSourcemaps
      ? {sourcemap: true, sourcesContent: false, sourcefile: filename}
      : {};

    const {code: sourcesCode} = await require('./transformer').transformerAsync({
      sourceText: content,
      sourcePath: filename,
      options: opts
    }) || content;

    let {map, code} = await transform(sourcesCode, {
      format: options?.format as Format || 'cjs',
      loader,
      target: options?.target || 'esnext',
      ...(options?.jsxFactory ? {jsxFactory: options.jsxFactory} : {}),
      ...(options?.jsxFragment ? {jsxFragment: options.jsxFragment} : {}),
      ...sourcemaps
    });

    if(enableSourcemaps) {
      map = {
        ...JSON.parse(map),
        sourcesContent: null
      };

      // Append the inline sourcemap manually to ensure the "sourcesContent"
      // is null. Otherwise, breakpoints won't pause within the actual source.
      code = `${code}\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(JSON.stringify(map)).toString('base64')}`;
    } else {
      map = null;
    }

    rimraf(pathResolve(process.cwd(), `./${tmpName}`), {});

    return {code, map};
  },

  process(content: string, filename: string, opts?: any) {
    const ext = getExt(filename);
    const extName = pathExtname(filename).slice(1);
    const tmpName = `${pathBasename(filename, extName)}.tmp.js`;
    const loaderName = extName.slice(1);
    const enableSourcemaps = options?.sourcemap || false;
    const loader = (options?.loaders?.[ext]
      ? options.loaders[ext]
      : loaders.includes(loaderName) ? loaderName : 'text'
    ) as Loader;
    const sourcemaps: Partial<TransformOptions> = enableSourcemaps
      ? {sourcemap: true, sourcesContent: false, sourcefile: filename}
      : {};

    const {code: sourcesCode} = require('./transformer').transformerSync({
      sourceText: content,
      sourcePath: filename,
      options: opts
    }) || content;

    let {map, code} = transformSync(sourcesCode, {
      format: options?.format as Format || 'cjs',
      loader,
      target: options?.target || 'esnext',
      ...(options?.jsxFactory ? {jsxFactory: options.jsxFactory} : {}),
      ...(options?.jsxFragment ? {jsxFragment: options.jsxFragment} : {}),
      ...sourcemaps
    });

    if(enableSourcemaps) {
      map = {
        ...JSON.parse(map),
        sourcesContent: null
      };

      // Append the inline sourcemap manually to ensure the "sourcesContent"
      // is null. Otherwise, breakpoints won't pause within the actual source.
      code = `${code}\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(JSON.stringify(map)).toString('base64')}`;
    } else {
      map = null;
    }

    rimrafSync(pathResolve(process.cwd(), `./${tmpName}`), {});

    return {code, map};
  }
});

export {Options} from './options';

export default {
  createTransformer
};