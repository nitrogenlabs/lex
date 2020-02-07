import editorconfig from 'editorconfig';
import editorConfigToPrettier from 'editorconfig-to-prettier';
import findProjectRoot from 'find-project-root';
import fs from 'fs';
import mem from 'mem';
import path from 'path';

const maybeParse = (filePath, config, parse) => {
  // findProjectRoot will throw an error if we pass a nonexistent directory to
  // it, which is possible, for example, when the path is given via
  // --stdin-filepath. So, first, traverse up until we find an existing
  // directory.
  let dirPath = path.dirname(path.resolve(filePath));
  const fsRoot = path.parse(dirPath).root;

  while(dirPath !== fsRoot && !fs.existsSync(dirPath)) {
    dirPath = path.dirname(dirPath);
  }

  const root = findProjectRoot(dirPath);
  return filePath && parse(filePath, {root});
};

const editorconfigAsyncNoCache = (filePath, config) =>
  Promise.resolve(maybeParse(filePath, config, editorconfig.parse))
    .then(editorConfigToPrettier);

const editorconfigAsyncWithCache = mem(editorconfigAsyncNoCache);

const editorconfigSyncNoCache = (filePath, config) => editorConfigToPrettier(
  maybeParse(filePath, config, editorconfig.parseSync)
);
const editorconfigSyncWithCache = mem(editorconfigSyncNoCache);

export const getLoadFunction = (opts) => {
  if(!opts.editorconfig) {
    return () => null;
  }

  if(opts.sync) {
    return opts.cache ? editorconfigSyncWithCache : editorconfigSyncNoCache;
  }

  return opts.cache ? editorconfigAsyncWithCache : editorconfigAsyncNoCache;
};

export const clearCache = () => {
  mem.clear(editorconfigSyncWithCache);
  mem.clear(editorconfigAsyncWithCache);
};
