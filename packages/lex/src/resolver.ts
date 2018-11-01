/**
 * Copyright (c) 2018, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
const fs = require('fs');
const path = require('path');
const resolve = require('resolve');

module.exports = (value, options) => {
  if(value === '') {
    return null;
  }

  const {basedir, extensions} = options;
  const hasBase = value.indexOf('./') >= 0 || value.indexOf('../') >= 0;

  if(hasBase) {
    const existingExt: string = path.extname(value) || '';

    if(existingExt !== '' && extensions.includes(existingExt)) {
      return path.resolve(`${basedir}/${value}`);
    }

    let fullPath = value;

    extensions.some((ext) => {
      const filename = path.resolve(`${basedir}/${value}${ext}`);

      if(fs.existsSync(filename)) {
        fullPath = filename;
        return true;
      }

      const indexFile = path.resolve(`${basedir}/${value}/index${ext}`);

      if(fs.existsSync(indexFile)) {
        fullPath = indexFile;
        return true;
      }

      return false;
    });

    return fullPath;
  }

  try {
    return resolve.sync(value, {basedir: `${__dirname}/../`, extensions});
  } catch(error) {
    try {
      return resolve.sync(value, {basedir: process.cwd(), extensions});
    } catch(error) {
      return null;
    }
  }
};
