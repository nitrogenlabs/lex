/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import findFileUp from 'find-file-up';
import {existsSync} from 'fs';
import {resolve as pathResolve} from 'path';
import {URL} from 'url';

// Get file paths relative to Lex
export const relativeFilePath = (filename: string, dirPath: string = './', backUp: number = 0): string => {
  const nestDepth: number = 10;

  if(backUp) {
    const filePath: string = findFileUp.sync(filename, dirPath, nestDepth);
    const previousPath: string = Array(backUp).fill(null).map(() => '../').join('');
    return pathResolve(filePath, previousPath);
  }

  return findFileUp.sync(filename, dirPath, nestDepth);
};

export const relativeNodePath = (filename: string, dirPath: string = './', backUp: number = 0): string => {
  const nestDepth: number = 10;

  if(backUp) {
    const filePath: string = findFileUp.sync(`node_modules/${filename}`, dirPath, nestDepth);
    const previousPath: string = Array(nestDepth).fill(null).map(() => '../').join('');
    return pathResolve(filePath, previousPath);
  }

  return findFileUp.sync(`node_modules/${filename}`, dirPath, nestDepth);
};

// Get file paths relative to Lex
export const getNodePath = (moduleName: string): string => {
  const dirName = new URL('.', import.meta.url).pathname;
  const modulePath: string = `node_modules/${moduleName}`;
  const repoPath: string = findFileUp.sync(modulePath, dirName);

  if(repoPath && existsSync(repoPath)) {
    return repoPath;
  }

  const localPath: string = findFileUp.sync(modulePath, './', 10) || `./${modulePath}`;
  return localPath;
};