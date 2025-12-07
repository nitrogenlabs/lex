/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import findFileUp from 'find-file-up';
import {existsSync, readFileSync} from 'fs';
import {sync as globSync} from 'glob';
import {resolve as pathResolve, dirname} from 'path';

import {LexConfig} from '../LexConfig.js';

export const getDirName = (): string => {
  try {
    return eval('new URL(".", import.meta.url).pathname');
  } catch{
    return process.cwd();
  }
};

export const getFilePath = (relativePath: string): string => {
  try {
    return eval('require("url").fileURLToPath(new URL(relativePath, import.meta.url))');
  } catch{
    if(relativePath === '../../../package.json') {
      return pathResolve(process.cwd(), 'package.json');
    }
    return pathResolve(process.cwd(), relativePath);
  }
};

export const getLexPackageJsonPath = (): string => {
  const LEX_PACKAGE_NAME = '@nlabs/lex';

  const lexInNodeModules = pathResolve(process.cwd(), 'node_modules/@nlabs/lex/package.json');

  if(existsSync(lexInNodeModules)) {
    return lexInNodeModules;
  }

  let startDir: string;

  if(process.env.LEX_ROOT) {
    startDir = process.env.LEX_ROOT;
  } else {
    try {
      startDir = eval('new URL(".", import.meta.url).pathname');
    } catch{
      try {
        startDir = eval('__filename ? require("path").dirname(__filename) : null');
        if(!startDir) {
          throw new Error('__filename not available');
        }
      } catch{
        try {
          if(process.argv[1] && !process.argv[1].includes('node')) {
            startDir = dirname(process.argv[1]);
          } else {
            throw new Error('process.argv[1] not suitable');
          }
        } catch{
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

export const relativeNodePath = (filename: string, dirPath: string = './', backUp: number = 0): string => {
  const nestDepth: number = 10;
  const modulePath = `node_modules/${filename}`;

  if(dirPath !== './') {
    const lexModulePath = pathResolve(dirPath, modulePath);
    if(existsSync(lexModulePath)) {
      return lexModulePath;
    }
  }

  const projectPath = pathResolve(process.cwd(), modulePath);
  if(existsSync(projectPath)) {
    return projectPath;
  }

  if(backUp) {
    const filePath: string = findFileUp.sync(modulePath, dirPath, nestDepth);
    const previousPath: string = Array(nestDepth).fill(null).map(() => '../').join('');
    return pathResolve(filePath, previousPath);
  }

  return findFileUp.sync(modulePath, dirPath, nestDepth) || `/node_modules/${filename}`;
};

export const getNodePath = (moduleName: string): string => {
  const dirName = getDirName();
  const modulePath: string = `node_modules/${moduleName}`;

  const projectPath = pathResolve(process.cwd(), modulePath);
  if(existsSync(projectPath)) {
    return projectPath;
  }

  const repoPath: string = findFileUp.sync(modulePath, dirName);
  if(repoPath && existsSync(repoPath)) {
    return repoPath;
  }

  const localPath: string = findFileUp.sync(modulePath, './', 10) || `./${modulePath}`;
  return localPath;
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

export const resolveWebpackPaths = (currentDirname: string): {webpackPath: string; webpackConfig: string} => {
  const possibleWebpackPaths = [
    pathResolve(process.cwd(), 'node_modules/webpack-cli/bin/cli.js'),
    pathResolve(process.cwd(), 'node_modules/.bin/webpack'),
    pathResolve(process.cwd(), 'node_modules/@nlabs/lex', 'node_modules/webpack-cli/bin/cli.js'),
    pathResolve(process.cwd(), 'node_modules/@nlabs/lex', 'node_modules/.bin/webpack'),
    pathResolve(currentDirname, 'node_modules/@nlabs/lex/node_modules/webpack-cli/bin/cli.js'),
    pathResolve(currentDirname, 'node_modules/@nlabs/lex/node_modules/.bin/webpack'),
    pathResolve(process.env.LEX_HOME || '/node_modules/@nlabs/lex', 'node_modules/webpack-cli/bin/cli.js'),
    pathResolve(process.env.LEX_HOME || '/node_modules/@nlabs/lex', 'node_modules/.bin/webpack')
  ];

  let webpackPath = '';

  for(const path of possibleWebpackPaths) {
    if(existsSync(path)) {
      webpackPath = path;
      break;
    }
  }

  if(!webpackPath) {
    try {
      const lexPackagePath = getLexPackageJsonPath();
      const lexPackageDir = dirname(lexPackagePath);
      const lexWebpackCli = pathResolve(lexPackageDir, 'node_modules/webpack-cli/bin/cli.js');
      const lexWebpackBin = pathResolve(lexPackageDir, 'node_modules/.bin/webpack');

      if(existsSync(lexWebpackCli)) {
        webpackPath = lexWebpackCli;
      } else if(existsSync(lexWebpackBin)) {
        webpackPath = lexWebpackBin;
      } else {
        webpackPath = 'npx';
      }
    } catch{
      webpackPath = 'npx';
    }
  }

  const possibleWebpackConfigPaths = [
    pathResolve(process.cwd(), 'webpack.config.js'),
    pathResolve(process.cwd(), 'webpack.config.ts'),
    pathResolve(process.cwd(), 'node_modules/@nlabs/lex/webpack.config.js'),
    pathResolve(process.cwd(), 'node_modules/@nlabs/lex/webpack.config.ts'),
    pathResolve(currentDirname, 'node_modules/@nlabs/lex/webpack.config.js'),
    pathResolve(currentDirname, 'node_modules/@nlabs/lex/webpack.config.ts'),
    pathResolve(process.env.LEX_HOME || '/node_modules/@nlabs/lex', 'webpack.config.js'),
    pathResolve(process.env.LEX_HOME || '/node_modules/@nlabs/lex', 'webpack.config.ts')
  ];

  let webpackConfig = '';

  for(const path of possibleWebpackConfigPaths) {
    if(existsSync(path)) {
      webpackConfig = path;
      break;
    }
  }

  if(!webpackConfig) {
    const lexPackagePath = getLexPackageJsonPath();
    const lexPackageDir = dirname(lexPackagePath);
    const lexWebpackConfig = pathResolve(lexPackageDir, 'webpack.config.js');

    if(existsSync(lexWebpackConfig)) {
      webpackConfig = lexWebpackConfig;
    } else {
      webpackConfig = pathResolve(currentDirname, '../../webpack.config.js');
    }
  }

  return {webpackConfig, webpackPath};
};