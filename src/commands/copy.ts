import * as fs from 'fs';
import * as path from 'path';

import {log} from '../utils';

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

export const copy = (from: string, to: string, cmd) => {
  const {quiet} = cmd;

  // Display message
  log(`Lex copying "${to}"...`, 'info', quiet);

  if(!fs.existsSync(from)) {
    log(`Lex Error: Path not found, "${from}"...`, 'error', quiet);
    process.exit(1);
    return false;
  }

  if(fs.lstatSync(from).isDirectory()) {
    try {
      // Copy directory
      copyFolderRecursiveSync(from, to);
    } catch(error) {
      log(`Lex Error: Cannot copy "${from}". ${error.message}`, 'error', quiet);
      process.exit(1);
      return false;
    }
  } else {
    try {
      // Copy file
      copyFileSync(from, to);
    } catch(error) {
      log(`Lex Error: Cannot copy "${from}" ${error.message}`, 'error', quiet);
      process.exit(1);
      return false;
    }
  }

  process.exit(0);
  return null;
};
