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

const updateName = (filePath: string, replace: string, replaceCaps: string) => {
  let data: string = fs.readFileSync(filePath, 'utf8');
  data = data.replace(/sample/g, replace);
  data = data.replace(/Sample/g, replaceCaps);
  fs.writeFileSync(filePath, data, 'utf8');
};

export const add = (type: string, name: string, cmd) => {
  const cwd: string = process.cwd();
  if(!name) {
    console.error(chalk.red(`Lex Error: ${type} name is required. Please use 'lex -h' for options.`));
    return false;
  }

  const nameCaps: string = `${name.charAt(0).toUpperCase()}${name.substr(1)}`;

  // Display message
  console.log(chalk.cyan(`Lex adding ${type}...`));

  switch(type) {
    case 'store': {
      const storePath: string = `${cwd}/${nameCaps}Store`;

      try {
        if(!fs.existsSync(storePath)) {
          // Copy store files
          copyFolderRecursiveSync(path.resolve(__dirname, '../../templates/.SampleStore'), cwd);

          // Rename directory
          fs.renameSync(`${cwd}/.SampleStore`, storePath);

          // Rename test
          const storeTestPath: string = `${storePath}/${nameCaps}Store.test.ts`;
          fs.renameSync(`${storePath}/SampleStore.test.ts`, storeTestPath);

          // Search and replace store name
          updateName(storeTestPath, name, nameCaps);

          // Rename source file
          const storeFilePath: string = `${storePath}/${nameCaps}Store.ts`;
          fs.renameSync(`${storePath}/SampleStore.ts`, storeFilePath);

          // Search and replace store name
          updateName(storeFilePath, name, nameCaps);
        } else {
          console.error(chalk.red(`Lex Error: Cannot create new ${type}. Directory, ${storePath} already exists.`));
          process.exit(1);
          return false;
        }
      } catch(error) {
        console.error(chalk.red(`Lex Error: Cannot create new ${type}.`, error.message));
        process.exit(1);
        return false;
      }
      break;
    }
    case 'view': {
      const viewPath: string = `${cwd}/${nameCaps}View`;

      try {
        if(!fs.existsSync(viewPath)) {
          // Copy view files
          copyFolderRecursiveSync(path.resolve(__dirname, '../../templates/.SampleView'), cwd);

          // Rename directory
          fs.renameSync(`${cwd}/.SampleView`, viewPath);

          // Rename CSS
          const viewStylePath: string = `${viewPath}/${name}View.css`;
          fs.renameSync(`${viewPath}/sampleView.css`, viewStylePath);

          // Search and replace view name
          updateName(viewStylePath, name, nameCaps);

          // Rename test
          const viewTestPath: string = `${viewPath}/${nameCaps}View.test.tsx`;
          fs.renameSync(`${viewPath}/SampleView.test.tsx`, viewTestPath);

          // Search and replace view name
          updateName(viewTestPath, name, nameCaps);

          // Rename source file
          const viewFilePath: string = `${viewPath}/${nameCaps}View.tsx`;
          fs.renameSync(`${viewPath}/SampleView.tsx`, viewFilePath);

          // Search and replace view name
          updateName(viewFilePath, name, nameCaps);
        } else {
          console.error(chalk.red(`Lex Error: Cannot create new ${type}. Directory, ${viewPath} already exists.`));
          process.exit(1);
          return false;
        }
      } catch(error) {
        console.error(chalk.red(`Lex Error: Cannot create new ${type}.`, error.message));
        process.exit(1);
        return false;
      }
      break;
    }
    case 'vscode': {
      // Copy vscode configuration
      copyFolderRecursiveSync(path.resolve(__dirname, '../../.vscode'), cwd);
      break;
    }
    default: {
      console.error(chalk.red(`Lex Error: "${type}" does not exist. Please use 'lex -h' for options.`));
      process.exit(1);
      return false;
    }
  }

  process.exit(0);
  return null;
};
