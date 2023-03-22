/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import boxen from 'boxen';
import {copyFile, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync} from 'fs';
import {globSync} from 'glob';
import isEmpty from 'lodash/isEmpty.js';
import ora from 'ora';
import {basename as pathBasename, join as pathJoin, relative as pathRelative, resolve as pathResolve} from 'path';
import {rimrafSync} from 'rimraf';

import {log} from './log.js';
import type {LexConfigType} from '../LexConfig.js';

export const cwd: string = process.cwd();

export const getFilenames = (props: any) => {
  const {callback, cliName, name, quiet, type, useTypescript} = props;

  // Set filename
  let nameCaps: string;
  const itemTypes: string[] = ['stores', 'views'];

  if(!name) {
    if(itemTypes.includes(type)) {
      log(`\n${cliName} Error: ${type} name is required. Please use 'lex -h' for options.`, 'error', quiet);
      return callback(1);
    }
  } else {
    nameCaps = `${name.charAt(0).toUpperCase()}${name.substr(1)}`;
  }

  // Display message
  log(`${cliName} adding ${name} ${type}...`, 'info', quiet);

  // Template directory
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

export const createSpinner = (quiet = false): any => {
  if(quiet) {
    return {
      fail: () => {},
      start: () => {},
      succeed: () => {}
    };
  }

  return ora({color: 'yellow'});
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
    // Stop spinner
    spinner.fail(`Copying of ${typeName} files failed.`);
    log(`Error: ${error.message}`, 'error');
    console.log(error);
  }
};

export const copyFileSync = (source: string, target: string) => {
  let targetFile: string = target;

  // If target is a directory a new file with the same name will be created
  if(existsSync(target)) {
    if(lstatSync(target).isDirectory()) {
      targetFile = pathJoin(target, pathBasename(source));
    }
  }

  writeFileSync(targetFile, readFileSync(source));
};

export const copyFolderRecursiveSync = (source: string, target: string): void => {
  let files: string[] = [];

  // Check if folder needs to be created or integrated
  const targetFolder: string = pathJoin(target, pathBasename(source));

  if(!existsSync(targetFolder)) {
    mkdirSync(targetFolder);
  }

  // Copy
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

  // Configure package.json
  const packageData: string = readFileSync(formatPath).toString();
  return JSON.parse(packageData);
};

export const getFilesByExt = (ext: string, config: LexConfigType): string[] => {
  const {sourceFullPath} = config;
  return globSync(`${sourceFullPath}/**/**${ext}`);
};

export const removeConflictModules = (moduleList: object) => {
  const updatedList: object = {...moduleList};

  Object.keys(updatedList).forEach((moduleName: string) => {
    const regex: RegExp = new RegExp('^(?!@types\/).*(jest|webpack).*$', 'gi');
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
    // Remove node_modules
    await removeFiles('./node_modules', true);

    // Remove yarn lock
    await removeFiles('./yarn.lock', true);

    // Remove npm lock
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

  // Update package.json
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

  // if we have a scope we should check if the modules inside the folder is linked
  if(workingPath.includes('@')) {
    prefix = `@${workingPath.split('@').pop()}`;
    modulePath = workingPath;
  } else {
    modulePath = pathJoin(workingPath, 'node_modules');
  }

  const foundPaths: string[] = globSync(`${modulePath}/*`);
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
    } catch(fsError) {
      throw fsError;
    }
  }, []);
};

// Check for linked modules
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
