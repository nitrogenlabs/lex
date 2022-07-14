/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
const {existsSync} = require('fs-extra');
const {extname, resolve} = require('path');
const resolveSync = require('resolve/sync');

const getFullPath = (basedir: string, name: string, extensions: string[]): string => {
  let fileName = name;

  extensions.some((ext) => {
    if(fileName !== '..') {
      const fullPath = resolve(`${basedir}/${fileName}${ext}`);

      if(existsSync(fullPath)) {
        fileName = fullPath;
        return true;
      }
    }

    if(fileName !== 'index') {
      const indexFile = resolve(`${basedir}/${fileName}/index${ext}`);

      if(existsSync(indexFile)) {
        fileName = indexFile;
        return true;
      }
    }

    return false;
  });

  return fileName;
};

module.exports = (value, options) => {
  let fileName = value;

  if(fileName === '') {
    return null;
  }

  const isSequencer = fileName.startsWith('jest-sequencer-');

  if(isSequencer) {
    fileName = fileName.replace('jest-sequencer-', '');
  }

  const {basedir, extensions = ['.js', '.ts']} = options;
  const existingExt = extname(fileName) || '';
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
      return resolve(`${basedir}/${fileName}`);
    }

    return getFullPath(basedir, fileName, extensions);
  }

  try {
    return resolveSync(fileName, {basedir: `${__dirname}/../`, extensions});
  } catch(error) {
    try {
      return resolveSync(fileName, {basedir: process.cwd(), extensions});
    } catch(error) {
      return null;
    }
  }
};
