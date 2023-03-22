/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {existsSync} from 'fs';
import {extname as pathExtname, resolve as pathResolve} from 'path';
import resolveSync from 'resolve/sync';
import {fileURLToPath} from 'url';

const getFullPath = (basedir: string, name: string, extensions: string[]): string => {
  let fileName = name;

  extensions.some((ext) => {
    if(fileName !== '..') {
      const fullPath = pathResolve(`${basedir}/${fileName}${ext}`);

      if(existsSync(fullPath)) {
        fileName = fullPath;
        return true;
      }
    }

    if(fileName !== 'index') {
      const indexFile = pathResolve(`${basedir}/${fileName}/index${ext}`);

      if(existsSync(indexFile)) {
        fileName = indexFile;
        return true;
      }
    }

    return false;
  });

  return fileName;
};

const resolver = (value, options) => {
  let fileName = value;

  if(fileName === '') {
    return null;
  }

  const isSequencer = fileName.startsWith('jest-sequencer-');

  if(isSequencer) {
    fileName = fileName.replace('jest-sequencer-', '');
  }

  const {basedir, extensions = ['.js', '.ts']} = options;
  const existingExt = pathExtname(fileName) || '';
  const hasExtension = existingExt !== '' && extensions.includes(existingExt);
  const isAbsolute = fileName.indexOf('/') === 0;

  if(isAbsolute) {
    if(hasExtension) {
      return existsSync(fileName) ? fileName : null;
    }

    return getFullPath(fileName, 'index', extensions);
  }

  if(fileName === '..') {
    return getFullPath(basedir, '..', extensions);
  }

  const hasBase = fileName.indexOf('./') >= 0 || fileName.indexOf('../') >= 0;

  if(hasBase) {
    if(hasExtension) {
      return pathResolve(`${basedir}/${fileName}`);
    }

    return getFullPath(basedir, fileName, extensions);
  }

  try {
    const dirName = fileURLToPath(new URL('.', import.meta.url));
    return resolveSync(fileName, {basedir: `${dirName}/../`, extensions});
  } catch(error) {
    try {
      return resolveSync(fileName, {basedir: process.cwd(), extensions});
    } catch(error) {
      return null;
    }
  }
};

export default resolver;