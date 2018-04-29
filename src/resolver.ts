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
    const ext: string = path.extname(value) || '';

    if(ext !== '') {
      return path.resolve(`${basedir}/${value}`);
    } else {
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
      });

      return fullPath;
    }
  }

  try {
    return resolve.sync(value, {basedir: __dirname});
  } catch(error) {
    return resolve.sync(value, {basedir: process.cwd()});
  }
};