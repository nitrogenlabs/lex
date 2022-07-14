/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import findFileUp from 'find-file-up';
import {existsSync} from 'fs-extra';
import path from 'path';

export const loaders = ['js', 'ts', 'tsx', 'json'];

export const getExt = (str: string) => {
  const basename = path.basename(str);
  const firstDot = basename.indexOf('.');
  const lastDot = basename.lastIndexOf('.');
  const extname = path.extname(basename).replace(/(\.[a-z0-9]+).*/i, '$1');

  if(firstDot === lastDot) {
    return extname;
  }

  return basename.slice(firstDot, lastDot) + extname;
};

// Get file paths relative to Lex
export const getNodePath = (moduleName: string): string => {
  const modulePath: string = `node_modules/${moduleName}`;
  const repoPath: string = findFileUp.sync(modulePath, __dirname);

  if(repoPath && existsSync(repoPath)) {
    return repoPath;
  }

  const localPath: string = findFileUp.sync(modulePath, './', 10) || `./${modulePath}`;
  return localPath;
};