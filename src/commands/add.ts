import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

const copyFileSync = (source: string, target: string) => {
  let targetFile: string = target;

  // If target is a directory a new file with the same name will be created
  if(fs.existsSync(target)) {
    if(fs.lstatSync(target).isDirectory()) {
      targetFile = path.join(target, path.basename(source));
    }
  }

  fs.writeFileSync(targetFile, fs.readFileSync(source));
};

const copyFolderRecursiveSync = (source: string, target: string): void => {
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

export const add = (type: string, cmd) => {
  let copyFile: string;
  const cwd: string = process.cwd();

  switch(type) {
    case 'vscode':
      copyFile = path.resolve(__dirname, '../../.vscode');
      break;
    default:
      console.error(chalk.red(`Lex Error: "${type}" does not exist. Please use 'lex -h' for options.`));
      process.exit(1);
      return false;
  }

  // Copy the files over
  console.log(chalk.cyan(`Lex adding ${type}...`));
  copyFolderRecursiveSync(copyFile, cwd);

  process.exit(0);
  return null;
};
