import ignore from 'ignore';
import path from 'path';

import {getFileContentOrNull} from '../utils/getFileContentOrNull';

const ignorer = (ignoreContent: string, withNodeModules: boolean) => {
  const ignorer = ignore().add(ignoreContent || '');
  if(!withNodeModules) {
    ignorer.add('node_modules');
  }
  return ignorer;
};

export const createIgnorer = (ignorePath: string, withNodeModules: boolean) => (!ignorePath
  ? Promise.resolve(null)
  : getFileContentOrNull(path.resolve(ignorePath))
).then((ignoreContent) => ignorer(ignoreContent, withNodeModules));
createIgnorer.sync = function(ignorePath: string, withNodeModules: boolean) {
  const ignoreContent = !ignorePath
    ? null
    : getFileContentOrNull.sync(path.resolve(ignorePath));
  return ignorer(ignoreContent, withNodeModules);
};
