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
  const modulePath = `node_modules/${filename}`;

  // First, check the Lex package's node_modules directory
  if(dirPath !== './') {
    const lexModulePath = pathResolve(dirPath, modulePath);
    if(existsSync(lexModulePath)) {
      return lexModulePath;
    }
  }

  // Second, check the user's project node_modules directory
  const projectPath = pathResolve(process.cwd(), modulePath);
  if(existsSync(projectPath)) {
    return projectPath;
  }

  // Original implementation as fallback
  if(backUp) {
    const filePath: string = findFileUp.sync(modulePath, dirPath, nestDepth);
    const previousPath: string = Array(nestDepth).fill(null).map(() => '../').join('');
    return pathResolve(filePath, previousPath);
  }

  return findFileUp.sync(modulePath, dirPath, nestDepth) || `/node_modules/${filename}`;
};

// Get file paths relative to Lex
export const getNodePath = (moduleName: string): string => {
  const dirName = new URL('.', import.meta.url).pathname;
  const modulePath: string = `node_modules/${moduleName}`;

  // Try project root first
  const projectPath = pathResolve(process.cwd(), modulePath);
  if(existsSync(projectPath)) {
    return projectPath;
  }

  // Then try module local to Lex
  const repoPath: string = findFileUp.sync(modulePath, dirName);
  if(repoPath && existsSync(repoPath)) {
    return repoPath;
  }

  // Fallback to general search
  const localPath: string = findFileUp.sync(modulePath, './', 10) || `./${modulePath}`;
  return localPath;
};