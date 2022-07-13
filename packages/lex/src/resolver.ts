/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
const {existsSync} = require('fs-extra');
const {extname, resolve} = require('path');
const resolveSync = require('resolve/sync');

const getFullPath = (basedir: string, name: string, extensions: string[]): string => {
  let fullPath = name;

  extensions.some((ext) => {
    if(name !== '..') {
      const filename = resolve(`${basedir}/${name}${ext}`);

      if(existsSync(filename)) {
        fullPath = filename;
        return true;
      }
    }

    const indexFile = resolve(`${basedir}/${name}/index${ext}`);

    if(existsSync(indexFile)) {
      fullPath = indexFile;
      return true;
    }

    return false;
  });

  return fullPath;
};

module.exports = (value, options) => {
  if(value === '') {
    return null;
  }

  const isAbsolute = value.indexOf('/') === 0;

  if(isAbsolute) {
    return value;
  }

  const {basedir, extensions} = options;

  if(value === '..') {
    return getFullPath(basedir, '..', extensions);
  }

  const hasBase = value.indexOf('./') >= 0 || value.indexOf('../') >= 0;

  if(hasBase) {
    const existingExt: string = extname(value) || '';

    if(existingExt !== '' && extensions.includes(existingExt)) {
      return resolve(`${basedir}/${value}`);
    }

    return getFullPath(basedir, value, extensions);
  }

  try {
    return resolveSync(value, {basedir: `${__dirname}/../`, extensions});
  } catch(error) {
    try {
      return resolveSync(value, {basedir: process.cwd(), extensions});
    } catch(error) {
      return null;
    }
  }
};
