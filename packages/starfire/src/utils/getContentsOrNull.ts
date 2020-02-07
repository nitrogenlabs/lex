import fs from 'fs';


export const createError = (filename, error) => new Error(`Unable to read ${filename}: ${error.message}`);

/**
 * @param {string} filename
 * @returns {Promise<null | string>}
 */
export const getFileContentOrNull = (filename) => new Promise((resolve, reject) => {
  fs.readFile(filename, 'utf8', (error, data) => {
    if(error && error.code !== 'ENOENT') {
      reject(createError(filename, error));
    } else {
      resolve(error ? null : data);
    }
  });
});

/**
 * @param {string} filename
 * @returns {null | string}
 */
getFileContentOrNull.sync = function(filename) {
  try {
    return fs.readFileSync(filename, 'utf8');
  } catch(error) {
    if(error && error.code === 'ENOENT') {
      return null;
    }
    throw createError(filename, error);
  }
};
