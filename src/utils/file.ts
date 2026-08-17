/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import findFileUp from 'find-file-up';
import {existsSync, readFileSync} from 'fs';
import {sync as globSync} from 'glob';
import {resolve as pathResolve, dirname} from 'path';
import {fileURLToPath} from 'url';

import {LexConfig} from '../LexConfig.js';

export const getDirName = (): string => dirname(fileURLToPath(import.meta.url));

export const getLexPackageJsonPath = (): string => {
  const LEX_PACKAGE_NAME = '@nlabs/lex';

  const lexInNodeModules = pathResolve(process.cwd(), 'node_modules/@nlabs/lex/package.json');

  if(existsSync(lexInNodeModules)) {
    return lexInNodeModules;
  }

  const startDir = process.env.LEX_ROOT || getDirName();

  let dir = startDir;
  for(let i = 0; i < 8; i++) {
    const pkgPath = pathResolve(dir, 'package.json');
    if(existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
        if(pkg.name === LEX_PACKAGE_NAME) {
          return pkgPath;
        }
      } catch{
      }
    }
    const parent = dirname(dir);
    if(parent === dir) {
      break;
    }
    dir = parent;
  }

  return pathResolve(process.cwd(), 'package.json');
};

export const relativeFilePath = (filename: string, dirPath: string = './', backUp: number = 0): string => {
  const nestDepth: number = 10;

  if(backUp) {
    const filePath: string = findFileUp.sync(filename, dirPath, nestDepth);
    const previousPath: string = Array(backUp).fill(null).map(() => '../').join('');
    return pathResolve(filePath, previousPath);
  }

  return findFileUp.sync(filename, dirPath, nestDepth);
};

export const relativeNodePath = (packageName: string, dirPath: string = process.cwd()): string => {
  const nodePath = pathResolve(dirPath, 'node_modules', packageName);
  if(existsSync(nodePath)) {
    return nodePath;
  }

  // Check parent directories for node_modules
  let checkDir = dirPath;
  for(let i = 0; i < 10; i++) {
    const checkPath = pathResolve(checkDir, 'node_modules', packageName);
    if(existsSync(checkPath)) {
      return checkPath;
    }
    const parentDir = pathResolve(checkDir, '..');
    if(parentDir === checkDir) {
      break;
    }
    checkDir = parentDir;
  }

  return '';
};

export const resolveBinaryPath = (binaryName: string, packageName?: string): string => {
  const lexDir = LexConfig.getLexDir();

  const lexBinPath = pathResolve(lexDir, `node_modules/.bin/${binaryName}`);
  if(existsSync(lexBinPath)) {
    return lexBinPath;
  }

  if(packageName) {
    const lexPackageBinPath = pathResolve(lexDir, `node_modules/${packageName}/bin/${binaryName}`);
    if(existsSync(lexPackageBinPath)) {
      return lexPackageBinPath;
    }

    const lexPackageBinJsPath = pathResolve(lexDir, `node_modules/${packageName}/bin/${binaryName}.js`);
    if(existsSync(lexPackageBinJsPath)) {
      return lexPackageBinJsPath;
    }

    const lexPackageBinCjsPath = pathResolve(lexDir, `node_modules/${packageName}/bin/${binaryName}.cjs`);
    if(existsSync(lexPackageBinCjsPath)) {
      return lexPackageBinCjsPath;
    }
  }

  const checkBinUp = (startDir: string) => {
    let checkDir = startDir;
    for(let i = 0; i < 5; i++) {
      const monorepoBinPath = pathResolve(checkDir, `node_modules/.bin/${binaryName}`);
      if(existsSync(monorepoBinPath)) {
        return monorepoBinPath;
      }
      const parentDir = pathResolve(checkDir, '..');
      if(parentDir === checkDir) {
        break;
      }
      checkDir = parentDir;
    }
    return '';
  };

  const fromCwd = checkBinUp(process.cwd());
  if(fromCwd) {
    return fromCwd;
  }

  const fromLex = checkBinUp(lexDir);
  if(fromLex) {
    return fromLex;
  }

  return '';
};

export const findTailwindCssPath = (): string => {
  const tailwindPatterns = ['**/tailwind.css'];

  for(const pattern of tailwindPatterns) {
    const files = globSync(pattern, {
      cwd: process.cwd(),
      ignore: ['**/node_modules/**', '**/dist/**', '**/lib/**', '**/build/**', '**/.storybook/**']
    });

    if(files.length > 0) {
      return pathResolve(process.cwd(), files[0]);
    }
  }

  return '';
};
