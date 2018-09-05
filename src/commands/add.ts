import * as fs from 'fs';
import * as path from 'path';

import {LexConfig} from '../LexConfig';
import {log} from '../utils';
import {removeFiles} from './clean';
import {copyFolderRecursiveSync} from './copy';

const updateName = (filePath: string, replace: string, replaceCaps: string) => {
  let data: string = fs.readFileSync(filePath, 'utf8');
  data = data.replace(/sample/g, replace);
  data = data.replace(/Sample/g, replaceCaps);
  fs.writeFileSync(filePath, data, 'utf8');
};

export const add = async (type: string, name: string, cmd) => {
  const {cliName = 'Lex', quiet} = cmd;
  const cwd: string = process.cwd();

  // Get custom configuration
  LexConfig.parseConfig(cmd, false);
  const {outputPath, sourcePath, useTypescript} = LexConfig.config;

  // Set filename
  let nameCaps: string;
  const itemNames: string[] = ['stores', 'views'];

  if(!name) {
    if(itemNames.includes(name)) {
      log(`${cliName} Error: ${type} name is required. Please use 'lex -h' for options.`, 'error', quiet);
      return false;
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

  switch(type) {
    case 'store': {
      const storePath: string = `${cwd}/${nameCaps}Store`;

      try {
        if(!fs.existsSync(storePath)) {
          // Copy store files
          copyFolderRecursiveSync(path.resolve(__dirname, templatePath, './.SampleStore'), cwd);

          // Rename directory
          fs.renameSync(`${cwd}/.SampleStore`, storePath);

          // Rename test
          const storeTestPath: string = `${storePath}/${nameCaps}Store.test${templateExt}`;
          fs.renameSync(`${storePath}/SampleStore.test${templateExt}.txt`, storeTestPath);

          // Search and replace store name
          updateName(storeTestPath, name, nameCaps);

          // Rename source file
          const storeFilePath: string = `${storePath}/${nameCaps}Store${templateExt}`;
          fs.renameSync(`${storePath}/SampleStore${templateExt}.txt`, storeFilePath);

          // Search and replace store name
          updateName(storeFilePath, name, nameCaps);
        } else {
          log(`${cliName} Error: Cannot create new ${type}. Directory, ${storePath} already exists.`, 'error', quiet);
          process.exit(1);
          return false;
        }
      } catch(error) {
        log(`${cliName} Error: Cannot create new ${type}. ${error.message}`, 'error', quiet);
        process.exit(1);
        return false;
      }
      break;
    }
    case 'tsconfig': {
      // Remove existing file
      await removeFiles('tsconfig.json', true);

      // Get tsconfig template
      const templatePath: string = path.resolve(__dirname, '../../tsconfig.json');
      let data: string = fs.readFileSync(templatePath, 'utf8');

      // Update Lex tsconfig template with source and output directories
      data = data.replace(/.\/src/g, sourcePath);
      data = data.replace(/.\/dist/g, outputPath);

      // Save new tsconfig to app
      const destPath: string = path.resolve(cwd, './tsconfig.json');
      fs.writeFileSync(destPath, data, 'utf8');
      break;
    }
    case 'view': {
      const viewPath: string = `${cwd}/${nameCaps}View`;

      try {
        if(!fs.existsSync(viewPath)) {
          // Copy view files
          copyFolderRecursiveSync(path.resolve(__dirname, templatePath, './.SampleView'), cwd);

          // Rename directory
          fs.renameSync(`${cwd}/.SampleView`, viewPath);

          // Rename CSS
          const viewStylePath: string = `${viewPath}/${name}View.css`;
          fs.renameSync(`${viewPath}/sampleView.css`, viewStylePath);

          // Search and replace view name
          updateName(viewStylePath, name, nameCaps);

          // Rename test
          const viewTestPath: string = `${viewPath}/${nameCaps}View.test${templateReact}`;
          fs.renameSync(`${viewPath}/SampleView.test${templateReact}.txt`, viewTestPath);

          // Search and replace view name
          updateName(viewTestPath, name, nameCaps);

          // Rename source file
          const viewFilePath: string = `${viewPath}/${nameCaps}View${templateReact}`;
          fs.renameSync(`${viewPath}/SampleView${templateReact}.txt`, viewFilePath);

          // Search and replace view name
          updateName(viewFilePath, name, nameCaps);
        } else {
          log(`${cliName} Error: Cannot create new ${type}. Directory, ${viewPath} already exists.`, 'error', quiet);
          process.exit(1);
          return false;
        }
      } catch(error) {
        log(`${cliName} Error: Cannot create new ${type}. ${error.message}`, 'error', quiet);
        process.exit(1);
        return false;
      }
      break;
    }
    case 'vscode': {
      // Remove existing directory
      await removeFiles('.vscode', true);

      // Copy vscode configuration
      copyFolderRecursiveSync(path.resolve(__dirname, '../../.vscode'), cwd);
      break;
    }
    default: {
      log(`${cliName} Error: "${type}" does not exist. Please use 'lex -h' for options.`, 'error', quiet);
      process.exit(1);
      return false;
    }
  }

  process.exit(0);
  return true;
};
