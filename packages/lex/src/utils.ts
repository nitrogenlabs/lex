import boxen from 'boxen';
import chalk from 'chalk';
import findFileUp from 'find-file-up';
import fs from 'fs';
import glob from 'glob';
import ora from 'ora';
import path from 'path';

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

export const getPackageJson = (packagePath?: string) => {
  const formatPath: string = packagePath || `${process.cwd()}/package.json`;

  // Configure package.json
  const packageData: string = fs.readFileSync(formatPath).toString();
  return JSON.parse(packageData);
};

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
  let prefix: string = '';

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
        list.push({name: `${prefix}/${path.basename(foundPath)}`, path: foundPath});
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
      `Linked ${msgModule} Warning:`
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
