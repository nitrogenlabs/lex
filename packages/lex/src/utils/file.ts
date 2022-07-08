/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import findFileUp from 'find-file-up';
import {existsSync} from 'fs-extra';

// Get file paths relative to Lex
export const relativeFilePath = (filename: string, nodePath: string = './', backUp: number = 0) => {
  const nestDepth: number = 10;

  if(backUp) {
    const filePath: string = findFileUp.sync(filename, nodePath, nestDepth);
    const previousPath: string = Array(backUp).fill(null).map(() => '../').join('');
    return path.resolve(filePath, previousPath);
  }

  return findFileUp.sync(filename, nodePath, nestDepth);
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