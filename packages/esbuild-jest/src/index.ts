import {extname} from 'path';
import {Format, Loader, TransformOptions, transformSync} from 'esbuild';

import {Options} from './options';
import {getExt, loaders} from './utils';

const createTransformer = (options?: Options) => ({
  process(content: string, filename: string, opts?: any) {
    const sources = {code: content};
    const ext = getExt(filename); const extName = extname(filename).slice(1);
    const enableSourcemaps = options?.sourcemap || false;
    const loader = (options?.loaders?.[ext]
      ? options.loaders[ext]
      : loaders.includes(extName) ? extName : 'text'
    ) as Loader;
    const sourcemaps: Partial<TransformOptions> = enableSourcemaps
      ? {sourcemap: true, sourcesContent: false, sourcefile: filename}
      : {};

    sources.code = require('./transformer').babelTransform({
      sourceText: content,
      sourcePath: filename,
      options: opts
    });

    const result = transformSync(sources.code, {
      loader,
      format: options?.format as Format || 'cjs',
      target: options?.target || 'es2018',
      ...(options?.jsxFactory ? {jsxFactory: options.jsxFactory} : {}),
      ...(options?.jsxFragment ? {jsxFragment: options.jsxFragment} : {}),
      ...sourcemaps
    });

    let {map, code} = result;
    if(enableSourcemaps) {
      map = {
        ...JSON.parse(result.map),
        sourcesContent: null
      };

      // Append the inline sourcemap manually to ensure the "sourcesContent"
      // is null. Otherwise, breakpoints won't pause within the actual source.
      code = `${code}\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(JSON.stringify(map)).toString('base64')}`;
    } else {
      map = null;
    }

    return {code, map};
  }
});

export {Options} from './options';

export default {
  createTransformer
};