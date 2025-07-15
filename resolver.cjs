/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
const {existsSync} = require('fs');
const {extname: pathExtname, resolve: pathResolve} = require('path');
const resolveSync = require('resolve/sync');

// Simple fallback for Jest's internal module resolution
const resolveJestInternal = (moduleName) => {
  // For Jest's internal requests, be more permissive
  if (moduleName === 'index') {
    // Jest might be looking for an index file in the current context
    const possibleIndexFiles = [
      pathResolve(process.cwd(), 'index.js'),
      pathResolve(process.cwd(), 'index.ts'),
      pathResolve(process.cwd(), 'index.cjs'),
      pathResolve(__dirname, '../index.js'),
      pathResolve(__dirname, '../index.ts'),
      pathResolve(__dirname, '../index.cjs')
    ];

    for (const indexFile of possibleIndexFiles) {
      if (existsSync(indexFile)) {
        return indexFile;
      }
    }
  }

  // For other bare module names, try Node.js resolution
  try {
    return require.resolve(moduleName);
  } catch (e) {
    // If that fails, try to find it in node_modules
    const possiblePaths = [
      pathResolve(process.cwd(), 'node_modules', moduleName),
      pathResolve(__dirname, '../node_modules', moduleName),
      pathResolve(__dirname, '../../node_modules', moduleName)
    ];

    for (const possiblePath of possiblePaths) {
      if (existsSync(possiblePath)) {
        // Check for package.json to get the main entry point
        const packageJsonPath = pathResolve(possiblePath, 'package.json');
        if (existsSync(packageJsonPath)) {
          try {
            const packageJson = require(packageJsonPath);
            const mainFile = packageJson.main || 'index.js';
            const mainPath = pathResolve(possiblePath, mainFile);
            if (existsSync(mainPath)) {
              return mainPath;
            }
          } catch (e) {
            // Continue to next path
          }
        }
        // If no package.json or main file, try index.js
        const indexPath = pathResolve(possiblePath, 'index.js');
        if (existsSync(indexPath)) {
          return indexPath;
        }
      }
    }
  }

  return null;
};

const getFullPath = (basedir, name, extensions) => {
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

module.exports = (value, options) => {
  let fileName = value;

  if(fileName === '') {
    return null;
  }

  const isSequencer = fileName.startsWith('jest-sequencer-');
  if(isSequencer) {
    fileName = fileName.replace('jest-sequencer-', '');
  }

  const {basedir, extensions = ['.js', '.ts', '.tsx', '.cjs']} = options;
  const existingExt = pathExtname(fileName) || '';
  const hasExtension = existingExt !== '' && extensions.includes(existingExt);
  const isAbsolute = fileName.indexOf('/') === 0;

  // For Jest's internal modules and transformers, use lex node_modules
  if (fileName.includes('babel-jest') ||
      fileName.includes('ts-jest') ||
      fileName.includes('jest-transform-graphql') ||
      fileName.includes('core-js') ||
      fileName.includes('regenerator-runtime') ||
      fileName.includes('jest-circus') ||
      fileName.includes('@jest/') ||
      fileName.includes('jest-sequencer-')) {
    try {
      const result = resolveSync(fileName, {basedir: pathResolve(__dirname, '../'), extensions});
      return result;
    } catch(error) {
      return null;
    }
  }

  // For internal node_modules imports (like core-js internal imports), use default resolution
  if (basedir && basedir.includes('node_modules') && (fileName.startsWith('./') || fileName.startsWith('../'))) {
    try {
      const result = resolveSync(fileName, {basedir, extensions});
      return result;
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
    } catch(error) {
      // If resolveSync fails, try the old method
      const result = pathResolve(basedir, fileName);

      // Check if the result is a directory and append index.js if needed
      if (existsSync(result) && !existsSync(result + '.js') && !existsSync(result + '.ts') && !existsSync(result + '.cjs')) {
        const stats = require('fs').statSync(result);
        if (stats.isDirectory()) {
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
    } catch(lexError) {
      // If still not found, throw the original error
      throw projectError;
    }
  }
};
