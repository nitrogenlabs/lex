/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
const {existsSync} = require('fs');
const {extname: pathExtname, resolve: pathResolve} = require('path');
const resolveSync = require('resolve/sync');


module.exports = (value, options) => {
  let fileName = value;

  if(fileName === '') {
    return null;
  }

  const isSequencer = fileName.startsWith('vitest-sequencer-');
  if(isSequencer) {
    fileName = fileName.replace('vitest-sequencer-', '');
  }

  const {basedir, extensions = ['.js', '.ts', '.tsx', '.cjs']} = options;
  const existingExt = pathExtname(fileName) || '';
  const hasExtension = existingExt !== '' && extensions.includes(existingExt);
  const isAbsolute = fileName.indexOf('/') === 0;

  // For Vitest's internal modules and transformers, use lex node_modules
  const isVitestModule = fileName === 'vitest' ||
    fileName.startsWith('vitest/') ||
    fileName.startsWith('@vitest/') ||
    fileName === 'vite-node' ||
    fileName.startsWith('vite-node/');

  if(isVitestModule ||
      fileName.includes('core-js') ||
      fileName.includes('regenerator-runtime') ||
      fileName.includes('vitest-sequencer-')) {
    try {
      const result = resolveSync(fileName, {basedir: pathResolve(__dirname, '../'), extensions});
      return result;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch(error) {
      return null;
    }
  }

  // For internal node_modules imports (like core-js internal imports), use default resolution
  if(basedir && basedir.includes('node_modules') && (fileName.startsWith('./') || fileName.startsWith('../'))) {
    try {
      const result = resolveSync(fileName, {basedir, extensions});
      return result;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch(error) {
      return null;
    }
  }

  if(isAbsolute) {
    if(hasExtension) {
      const result = existsSync(fileName) ? fileName : null;
      return result;
    }
    const result = pathResolve(fileName, 'index');
    return result;
  }

  if(fileName === '..') {
    const result = pathResolve(basedir, '..');
    return result;
  }

  const hasBase = fileName.indexOf('./') >= 0 || fileName.indexOf('../') >= 0;
  if(hasBase) {
    if(hasExtension) {
      const result = pathResolve(basedir, fileName);
      return result;
    }

    // For relative paths without extension, try to resolve with extensions
    try {
      const result = resolveSync(fileName, {basedir, extensions});
      return result;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch(error) {
      // If resolveSync fails, try the old method
      const result = pathResolve(basedir, fileName);

      // Check if the result is a directory and append index.js if needed
      if(existsSync(result) && !existsSync(`${result}.js`) && !existsSync(`${result}.ts`) && !existsSync(`${result}.cjs`)) {
        const stats = require('fs').statSync(result);
        if(stats.isDirectory()) {
          const indexResult = pathResolve(result, 'index.js');
          return indexResult;
        }
      }

      return result;
    }
  }

  // For bare module names (like @nlabs/utils), try our custom resolution
  try {
    const result = resolveSync(fileName, {basedir: process.cwd(), extensions});
    return result;
  } catch(projectError) {
    // If not found, try to resolve from the Lex package's directory
    try {
      const result = resolveSync(fileName, {basedir: pathResolve(__dirname, '../'), extensions});
      return result;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch(lexError) {
      // If still not found, throw the original error
      throw projectError;
    }
  }
};
