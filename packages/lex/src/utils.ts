/**
 * Copyright (c) 2018, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import boxen from 'boxen';
import chalk from 'chalk';
import findFileUp from 'find-file-up';
import fs from 'fs-extra';
import glob from 'glob';
import isEmpty from 'lodash/isEmpty';
import ora from 'ora';
import path from 'path';
import rimraf from 'rimraf';

import {LexConfig} from './LexConfig';

export const cwd: string = process.cwd();

export const log = (message: string, type: string = 'info', quiet = false) => {
  if(!quiet) {
    let color;

    switch(type) {
      case 'error':
        color = chalk.red;
        break;
      case 'note':
        color = chalk.grey;
        break;
      case 'success':
        color = chalk.greenBright;
        break;
      case 'warn':
        color = chalk.yellow;
        break;
      default:
        color = chalk.cyan;
        break;
    }

    console.log(color(message));
  }
};

export const getFilenames = (props) => {
  const {callback, cliName, name, quiet, type, useTypescript} = props;
  // Set filename
  let nameCaps: string;
  const itemNames: string[] = ['stores', 'views'];

  if(!name) {
    if(itemNames.includes(name)) {
      log(`\n${cliName} Error: ${type} name is required. Please use 'lex -h' for options.`, 'error', quiet);
      return callback(1);
    }
  } else {
    nameCaps = `${name.charAt(0).toUpperCase()}${name.substr(1)}`;
  }

  // Display message
  log(`${cliName} adding ${type}...`, 'info', quiet);

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

export const copyFiles = async (files: string[], typeName: string, spinner) => {
  const {outputFullPath, sourceFullPath} = LexConfig.config;
  const items = files.map((fileName: string) => ({
    from: fileName,
    to: path.resolve(outputFullPath, path.relative(sourceFullPath, fileName))
  }));

  try {
    spinner.start(`Copying ${typeName} files...`);
    await Promise.all(items.map(({from, to}) => fs.copy(from, to)));
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
  if(fs.existsSync(target)) {
    if(fs.lstatSync(target).isDirectory()) {
      targetFile = path.join(target, path.basename(source));
    }
  }

  fs.writeFileSync(targetFile, fs.readFileSync(source));
};

export const copyFolderRecursiveSync = (source: string, target: string): void => {
  let files: string[] = [];

  // Check if folder needs to be created or integrated
  const targetFolder: string = path.join(target, path.basename(source));

  if(!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder);
  }

  // Copy
  if(fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source);
    files.forEach((file: string) => {
      const curSource: string = path.join(source, file);

      if(fs.lstatSync(curSource).isDirectory()) {
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
  const packageData: string = fs.readFileSync(formatPath).toString();
  return JSON.parse(packageData);
};

export const getFilesByExt = (ext: string): string[] => {
  const {sourceFullPath} = LexConfig.config;
  return glob.sync(`${sourceFullPath}/**/*${ext}`);
};

export const removeConflictModules = (moduleList: object) => {
  const updatedList: object = {...moduleList};

  Object.keys(updatedList).forEach((moduleName: string) => {
    const regex: RegExp = new RegExp('^(?!@types\/).*(babel|jest|webpack).*$', 'gi');
    if(regex.test(moduleName)) {
      delete updatedList[moduleName];
    }
  });

  return updatedList;
};

export const removeFiles = (fileName: string, isRelative: boolean = false) => new Promise((resolve, reject) => {
  const filePath: string = isRelative ? path.resolve(cwd, fileName) : fileName;

  rimraf(filePath, (error) => {
    if(error) {
      return reject(error);
    }

    return resolve();
  });
});

export const removeModules = () => new Promise(async (resolve, reject) => {
  try {
    // Remove node_modules
    await removeFiles('./node_modules', true);

    // Remove yarn lock
    await removeFiles('./yarn.lock', true);

    // Remove npm lock
    await removeFiles('./package-lock.json', true);

    resolve();
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
  fs.writeFileSync(formatPath, JSON.stringify(json, null, 2));
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
    modulePath = path.join(workingPath, 'node_modules');
  }

  const foundPaths: string[] = glob.sync(`${modulePath}/*`);
  return foundPaths.reduce((list: LinkedModuleType[], foundPath: string) => {
    try {
      const stats = fs.lstatSync(foundPath);

      if(stats.isDirectory()) {
        const deepList: LinkedModuleType[] = linkedModules(foundPath);
        list.push(...deepList);
      } else if(stats.isSymbolicLink()) {
        const moduleNames: string[] = ([prefix, path.basename(foundPath)]).filter((item: string) => !isEmpty(item));
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
    log(boxen(linkedMsg, {borderStyle: 'round', dimBorder: true, padding: 1}), 'warn');
  }
};

// Get file paths relative to Lex
export const relativeFilePath = (filename: string, nodePath: string, backUp: number = 0) => {
  const nestDepth: number = 10;

  if(backUp) {
    const filePath: string = findFileUp.sync(filename, nodePath, nestDepth);
    const previousPath: string = Array(backUp).fill(null).map(() => '../').join('');
    return path.resolve(filePath, previousPath);
  }

  return findFileUp.sync(filename, nodePath, nestDepth);
};

export const updateTemplateName = (filePath: string, replace: string, replaceCaps: string) => {
  let data: string = fs.readFileSync(filePath, 'utf8');
  data = data.replace(/sample/g, replace);
  data = data.replace(/Sample/g, replaceCaps);
  fs.writeFileSync(filePath, data, 'utf8');
};
