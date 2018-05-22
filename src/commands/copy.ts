import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

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
  // Display message
  console.log(chalk.cyan(`Lex copying "${to}"...`));

  if(!fs.existsSync(from)) {
    console.error(chalk.red(`Lex Error: Path not found, "${from}"...`));
    process.exit(1);
    return false;
  }

  if(fs.lstatSync(from).isDirectory()) {
    try {
      // Copy directory
      copyFolderRecursiveSync(from, to);
    } catch(error) {
      console.error(chalk.red(`Lex Error: Cannot copy "${from}".`, error.message));
      process.exit(1);
      return false;
    }
  } else {
    try {
      // Copy file
      copyFileSync(from, to);
    } catch(error) {
      console.error(chalk.red(`Lex Error: Cannot copy "${from}"`, error.message));
      process.exit(1);
      return false;
    }
  }

  process.exit(0);
  return null;
};
