/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */

import boxen from 'boxen';
import chalk from 'chalk';
import {copyFile, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync} from 'fs';
import {sync as globSync} from 'glob';
import isEmpty from 'lodash/isEmpty.js';
import ora from 'ora';
import {basename as pathBasename, join as pathJoin, relative as pathRelative, resolve as pathResolve} from 'path';
import {rimrafSync} from 'rimraf';


import {log} from './log.js';

import type {LexConfigType} from '../LexConfig.js';


export const cwd: string = process.cwd();

export interface GetFilenamesProps {
  readonly callback?: (status: number)=> void;
  readonly cliName?: string;
  readonly name?: string;
  readonly quiet?: boolean;
  readonly type?: string;
  readonly useTypescript?: boolean;
}

interface FilenamesResult {
  nameCaps: string;
  templateExt: string;
  templatePath: string;
  templateReact: string;
}

export const getFilenames = (props: GetFilenamesProps): FilenamesResult | undefined => {
  const {callback, cliName, name, quiet, type, useTypescript} = props;

  let nameCaps: string;
  const itemTypes: string[] = ['stores', 'views'];

  if(!name) {
    if(itemTypes.includes(type)) {
      log(`\n${cliName} Error: ${type} name is required. Please use 'lex -h' for options.`, 'error', quiet);
      callback?.(1);
      return undefined;
    }
  } else {
    nameCaps = `${name.charAt(0).toUpperCase()}${name.substr(1)}`;
  }

  log(`${cliName} adding ${name} ${type}...`, 'info', quiet);

  let templatePath: string;
  let templateExt: string;
  let templateReact: string;

  if(useTypescript) {
    templatePath = '../../templates/typescript';
    templateExt = '.ts';
    templateReact = '.tsx';
  } else {
    templatePath = '../../templates/flow';
    templateExt = '.js';
    templateReact = '.js';
  }

  return {
    nameCaps,
    templateExt,
    templatePath,
    templateReact
  };
};

export interface Spinner {
  fail: (text?: string)=> void;
  start: (text?: string)=> void;
  succeed: (text?: string)=> void;
  text?: string;
}

export const createSpinner = (quiet = false): Spinner => {
  if(quiet) {
    return {
      fail: () => {},
      start: () => {},
      succeed: () => {}
    };
  }

  return ora({color: 'yellow'});
};

export const createProgressBar = (percentage: number): string => {
  const width = 20;
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;

  const filledBar = chalk.cyan('█').repeat(filled);
  const emptyBar = chalk.gray('░').repeat(empty);

  return filledBar + emptyBar;
};

export const handleWebpackProgress = (
  output: string,
  spinner: Spinner,
  quiet: boolean,
  emoji: string,
  action: string
): void => {
  if(quiet) {
    return;
  }

  const progressMatch = output.match(/\[webpack\.Progress\] (\d+)%/);
  if(progressMatch) {
    const progress = parseInt(progressMatch[1]);
    const progressBar = createProgressBar(progress);
    spinner.text = `${emoji} ${action}: ${progressBar} ${progress}%`;
  } else if(output.includes('[webpack.Progress]')) {
    const generalProgressMatch = output.match(/(\d+)%/);
    if(generalProgressMatch) {
      const progress = parseInt(generalProgressMatch[1]);
      const progressBar = createProgressBar(progress);
      spinner.text = `${emoji} ${action}: ${progressBar} ${progress}%`;
    }
  }
};

export const copyFiles = async (files: string[], typeName: string, spinner, config: LexConfigType) => {
  const {outputFullPath, sourceFullPath} = config;
  const items = files.map((fileName: string) => ({
    from: fileName,
    to: pathResolve(outputFullPath, pathRelative(sourceFullPath, fileName))
  }));

  try {
    spinner.start(`Copying ${typeName} files...`);
    await Promise.all(items.map(({from, to}) => new Promise(
      (resolve, reject) => {
        mkdirSync(pathResolve(to, '..'), {recursive: true});
        return copyFile(from, to, (copyError) => {
          if(copyError) {
            reject();
          } else {
            resolve(true);
          }
        });
      }
    )));
    spinner.succeed(`Successfully copied ${files.length} ${typeName} files!`);
  } catch(error) {
    spinner.fail(`Copying of ${typeName} files failed.`);
    log(`Error: ${error.message}`, 'error');
    log(error, 'error');
  }
};

export const copyConfiguredFiles = async (spinner, config: LexConfigType, quiet: boolean) => {
  const {copyFiles: copyFilesConfig, outputFullPath, sourceFullPath, sourcePath} = config;
  if(!copyFilesConfig || copyFilesConfig.length === 0) {
    return;
  }

  try {
    spinner.start('Copying configured files...');
    let totalCopied = 0;

    const baseDir = sourceFullPath || (sourcePath ? pathResolve(cwd, sourcePath) : cwd);
    const allCopyPromises: Promise<unknown>[] = [];

    for(const pattern of copyFilesConfig) {
      const resolvedPattern = pathResolve(baseDir, pattern);
      const matchingFiles = globSync(resolvedPattern, {
        absolute: true,
        nodir: true
      });

      if(matchingFiles.length === 0) {
        if(!quiet) {
          log(`Warning: No files found matching pattern: ${pattern}`, 'warn', quiet);
        }
        continue;
      }

      const copyPromises = matchingFiles.map((sourceFile) => {
        const relativePath = pathRelative(baseDir, sourceFile);
        const destPath = pathResolve(outputFullPath, relativePath);
        const destDir = pathResolve(destPath, '..');
        mkdirSync(destDir, {recursive: true});

        return new Promise((resolve, reject) => {
          copyFile(sourceFile, destPath, (copyError) => {
            if(copyError) {
              reject(copyError);
            } else {
              resolve(true);
            }
          });
        });
      });

      allCopyPromises.push(...copyPromises);
      totalCopied += matchingFiles.length;
    }

    await Promise.all(allCopyPromises);

    if(totalCopied > 0) {
      spinner.succeed(`Successfully copied ${totalCopied} configured files!`);
    } else {
      spinner.succeed('No configured files to copy');
    }
  } catch(error) {
    spinner.fail('Failed to copy configured files');
    log(`Error copying configured files: ${error.message}`, 'error', quiet);
    throw error;
  }
};

export const copyFileSync = (source: string, target: string) => {
  let targetFile: string = target;

  if(existsSync(target)) {
    if(lstatSync(target).isDirectory()) {
      targetFile = pathJoin(target, pathBasename(source));
    }
  }

  writeFileSync(targetFile, readFileSync(source));
};

export const copyFolderRecursiveSync = (source: string, target: string): void => {
  let files: string[] = [];

  const targetFolder: string = pathJoin(target, pathBasename(source));

  if(!existsSync(targetFolder)) {
    mkdirSync(targetFolder);
  }

  if(lstatSync(source).isDirectory()) {
    files = readdirSync(source);
    files.forEach((file: string) => {
      const curSource: string = pathJoin(source, file);

      if(lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, targetFolder);
      } else {
        copyFileSync(curSource, targetFolder);
      }
    });
  }
};

export const getPackageJson = (packagePath?: string) => {
  const formatPath: string = packagePath || `${process.cwd()}/package.json`;
  const packageData: string = readFileSync(formatPath).toString();

  return JSON.parse(packageData);
};

export const getFilesByExt = (ext: string, config: LexConfigType): string[] => {
  const {sourceFullPath} = config;
  return globSync(`**/**${ext}`, {
    absolute: true,
    cwd: sourceFullPath,
    nodir: true
  });
};

export const removeConflictModules = (moduleList: object) => {
  const updatedList: object = {...moduleList};

  Object.keys(updatedList).forEach((moduleName: string) => {
    const regex: RegExp = new RegExp('^(?!@types/).*?(jest|webpack).*$', 'gi');
    if(regex.test(moduleName)) {
      delete updatedList[moduleName];
    }
  });

  return updatedList;
};

export const removeFiles = (fileName: string, isRelative: boolean = false) => new Promise((resolve, reject) => {
  const filePath: string = isRelative ? pathResolve(cwd, fileName) : fileName;

  try {
    rimrafSync(filePath);
    return resolve(null);
  } catch(error) {
    return reject(error);
  }
});

export const removeModules = () => new Promise(async (resolve, reject) => {
  try {
    await removeFiles('./node_modules', true);
    await removeFiles('./yarn.lock', true);
    await removeFiles('./package-lock.json', true);

    resolve(null);
  } catch(error) {
    reject(error);
  }
});

export const setPackageJson = (json, packagePath?: string) => {
  if(!json) {
    return;
  }

  const formatPath: string = packagePath || `${process.cwd()}/package.json`;

  writeFileSync(formatPath, JSON.stringify(json, null, 2));
};

export interface LinkedModuleType {
  readonly name: string;
  readonly path: string;
}

export const linkedModules = (startPath?: string): LinkedModuleType[] => {
  const workingPath: string = startPath || process.cwd();
  let modulePath: string;
  let prefix: string;

  if(workingPath.includes('@')) {
    prefix = `@${workingPath.split('@').pop()}`;
    modulePath = workingPath;
  } else {
    modulePath = pathJoin(workingPath, 'node_modules');
  }

  const foundPaths: string[] = globSync('*', {
    absolute: true,
    cwd: modulePath,
    nodir: false
  });

  return foundPaths.reduce((list: LinkedModuleType[], foundPath: string) => {
    try {
      const stats = lstatSync(foundPath);

      if(stats.isDirectory()) {
        const deepList: LinkedModuleType[] = linkedModules(foundPath);
        list.push(...deepList);
      } else if(stats.isSymbolicLink()) {
        const moduleNames: string[] = ([prefix, pathBasename(foundPath)]).filter((item: string) => !isEmpty(item));
        list.push({name: `${moduleNames.join('/')}`, path: foundPath});
      }

      return list;
    } catch{
      return list;
    }
  }, []);
};

export const checkLinkedModules = () => {
  const linked = linkedModules();

  if(linked.length) {
    const msgModule: string = linked.length > 1 ? 'Modules' : 'Module';
    const linkedMsg: string = linked.reduce(
      (msg: string, linkedModule: LinkedModuleType) =>
        `${msg}\n * ${linkedModule.name}`,
      `Linked ${msgModule}:`
    );

    log(boxen(linkedMsg, {dimBorder: true, padding: 1}), 'warn');
  }
};

export const updateTemplateName = (filePath: string, replace: string, replaceCaps: string) => {
  let data: string = readFileSync(filePath, 'utf8');
  data = data.replace(/sample/g, replace);
  data = data.replace(/Sample/g, replaceCaps);
  writeFileSync(filePath, data, 'utf8');
};