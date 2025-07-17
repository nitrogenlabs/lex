/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import findFileUp from 'find-file-up';
import {existsSync, readFileSync} from 'fs';
import {resolve as pathResolve, dirname} from 'path';
import {sync as globSync} from 'glob';


import {LexConfig} from '../LexConfig.js';

/**
 * Safely get directory name that works in both ESM and Jest environments
 */
export function getDirName(): string {
  try {
    // Only works in ESM environments
    // eslint-disable-next-line no-eval
    return eval('new URL(".", import.meta.url).pathname');
  } catch {
    // Fallback for Jest or CJS
    return process.cwd();
  }
}

/**
 * Safely get file path that works in both ESM and Jest environments
 */
export function getFilePath(relativePath: string): string {
  try {
    // Only works in ESM environments
    // eslint-disable-next-line no-eval
    return eval('require("url").fileURLToPath(new URL(relativePath, import.meta.url))');
  } catch {
    // Fallback for Jest or CJS
    if(relativePath === '../../../package.json') {
      return pathResolve(process.cwd(), 'package.json');
    }
    return pathResolve(process.cwd(), relativePath);
  }
}

/**
 * Get the path to Lex's own package.json, regardless of CWD
 */
export function getLexPackageJsonPath(): string {
  const LEX_PACKAGE_NAME = '@nlabs/lex';
  let startDir: string;

  if(process.env.LEX_ROOT) {
    startDir = process.env.LEX_ROOT;
  } else {
    // Try multiple approaches to get the Lex CLI's directory
    try {
      // Approach 1: ESM import.meta.url
      startDir = eval('new URL(".", import.meta.url).pathname');
    } catch(err1) {
      try {
        // Approach 2: CJS __filename (if available)
        startDir = eval('__filename ? require("path").dirname(__filename) : null');
        if(!startDir) {
          throw new Error('__filename not available');
        }
      } catch(err2) {
        try {
          // Approach 3: Use process.argv[1] (the actual script being executed)
          if(process.argv[1] && !process.argv[1].includes('node')) {
            startDir = dirname(process.argv[1]);
          } else {
            throw new Error('process.argv[1] not suitable');
          }
        } catch(err3) {
          // Approach 4: Fallback to process.cwd()
          startDir = process.cwd();
        }
      }
    }
  }

  let dir = startDir;
  for(let i = 0; i < 8; i++) {
    const pkgPath = pathResolve(dir, 'package.json');
    if(existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
        if(pkg.name === LEX_PACKAGE_NAME) {
          return pkgPath;
        }
      } catch(error) {
        // Silently continue if package.json can't be read
      }
    }
    const parent = dirname(dir);
    if(parent === dir) break;
    dir = parent;
  }
  // Fallback to process.cwd() as last resort
  return pathResolve(process.cwd(), 'package.json');
}

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
  const dirName = getDirName();
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

/**
 * Resolve binary path with fallback logic for monorepo and package scenarios
 * Checks: 1) Lex's node_modules/.bin/, 2) Lex's node_modules/<package>/bin/, 3) Monorepo root node_modules/.bin/ (from process.cwd()), 4) Monorepo root node_modules/.bin/ (from Lex's dir)
 */
export const resolveBinaryPath = (binaryName: string, packageName?: string): string => {
  const lexDir = LexConfig.getLexDir();

  // 1. Check Lex's node_modules/.bin/
  const lexBinPath = pathResolve(lexDir, `node_modules/.bin/${binaryName}`);
  if(existsSync(lexBinPath)) {
    return lexBinPath;
  }

  // 2. Check Lex's node_modules/<package>/bin/ (if packageName provided)
  if(packageName) {
    const lexPackageBinPath = pathResolve(lexDir, `node_modules/${packageName}/bin/${binaryName}`);
    if(existsSync(lexPackageBinPath)) {
      return lexPackageBinPath;
    }

    // Also check for .js extension
    const lexPackageBinJsPath = pathResolve(lexDir, `node_modules/${packageName}/bin/${binaryName}.js`);
    if(existsSync(lexPackageBinJsPath)) {
      return lexPackageBinJsPath;
    }

    // Check for .cjs extension
    const lexPackageBinCjsPath = pathResolve(lexDir, `node_modules/${packageName}/bin/${binaryName}.cjs`);
    if(existsSync(lexPackageBinCjsPath)) {
      return lexPackageBinCjsPath;
    }
  }

  // 3. Walk up from process.cwd() and check node_modules/.bin/
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

  // 3a. Walk up from process.cwd()
  const fromCwd = checkBinUp(process.cwd());
  if(fromCwd) {
    return fromCwd;
  }

  // 3b. Walk up from Lex's directory
  const fromLex = checkBinUp(lexDir);
  if(fromLex) {
    return fromLex;
  }

  // Not found
  return '';
};

export const findTailwindCssPath = (): string => {
  const tailwindPatterns = ['**/tailwind.css'];

  for(const pattern of tailwindPatterns) {
    const files = globSync(pattern, {
      cwd: process.cwd(),
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.storybook/**']
    });

    if(files.length > 0) {
      return pathResolve(process.cwd(), files[0]);
    }
  }

  return '';
};