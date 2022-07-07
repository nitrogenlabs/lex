/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import fs from 'fs';
import path from 'path';

import {createChangelog} from '../create/changelog';
import {LexConfig} from '../LexConfig';
import {copyFolderRecursiveSync, getFilenames, removeFiles, updateTemplateName} from '../utils/app';
import {log} from '../utils/log';

export const create = async (type: string, cmd: any, callback: any = () => ({})): Promise<number> => {
  const {cliName = 'Lex', outputFile, outputName, quiet} = cmd;
  const cwd: string = process.cwd();
  log(`${cliName} creating ${type}...`, 'info', quiet);

  // Get custom configuration
  LexConfig.parseConfig(cmd, false);
  const {outputPath, sourcePath, useTypescript} = LexConfig.config;

  if(useTypescript) {
    // Make sure tsconfig.json exists
    LexConfig.checkTypescriptConfig();
  }

  const {config} = LexConfig;

  switch(type) {
    case 'changelog': {
      const statusChangelog: number = await createChangelog({cliName, config, outputFile, quiet});
      callback(statusChangelog);
      return statusChangelog;
    }
    case 'store': {
      try {
        const {nameCaps, templateExt, templatePath} = getFilenames({
          cliName,
          name: outputName,
          quiet,
          type,
          useTypescript
        });
        const storePath: string = `${cwd}/${nameCaps}Store`;

        if(!fs.existsSync(storePath)) {
          // Copy store files
          copyFolderRecursiveSync(path.resolve(__dirname, templatePath, './.SampleStore'), cwd);

          // Rename directory
          fs.renameSync(`${cwd}/.SampleStore`, storePath);

          // Rename test
          const storeTestPath: string = `${storePath}/${nameCaps}Store.test${templateExt}`;
          fs.renameSync(`${storePath}/SampleStore.test${templateExt}.txt`, storeTestPath);

          // Search and replace store name
          updateTemplateName(storeTestPath, outputName, nameCaps);

          // Rename source file
          const storeFilePath: string = `${storePath}/${nameCaps}Store${templateExt}`;
          fs.renameSync(`${storePath}/SampleStore${templateExt}.txt`, storeFilePath);

          // Search and replace store name
          updateTemplateName(storeFilePath, outputName, nameCaps);
        } else {
          log(`\n${cliName} Error: Cannot create new ${type}. Directory, ${storePath} already exists.`, 'error', quiet);
          callback(1);
          return 1;
        }
      } catch(error) {
        log(`\n${cliName} Error: Cannot create new ${type}. ${error.message}`, 'error', quiet);
        callback(1);
        return 1;
      }
      break;
    }
    case 'tsconfig': {
      // Remove existing file
      await removeFiles('tsconfig.json', true);

      // Get tsconfig template
      const templatePath: string = path.resolve(__dirname, '../../tsconfig.template.json');
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
      const {nameCaps, templatePath, templateReact} = getFilenames({
        cliName,
        name: outputName,
        quiet,
        type,
        useTypescript
      });
      const viewPath: string = `${cwd}/${nameCaps}View`;

      try {
        if(!fs.existsSync(viewPath)) {
          // Copy view files
          copyFolderRecursiveSync(path.resolve(__dirname, templatePath, './.SampleView'), cwd);

          // Rename directory
          fs.renameSync(`${cwd}/.SampleView`, viewPath);

          // Rename CSS
          const viewStylePath: string = `${viewPath}/${outputName}View.css`;
          fs.renameSync(`${viewPath}/sampleView.css`, viewStylePath);

          // Search and replace view name
          updateTemplateName(viewStylePath, outputName, nameCaps);

          // Rename test
          const viewTestPath: string = `${viewPath}/${nameCaps}View.test${templateReact}`;
          fs.renameSync(`${viewPath}/SampleView.test${templateReact}.txt`, viewTestPath);

          // Search and replace view name
          updateTemplateName(viewTestPath, outputName, nameCaps);

          // Rename source file
          const viewFilePath: string = `${viewPath}/${nameCaps}View${templateReact}`;
          fs.renameSync(`${viewPath}/SampleView${templateReact}.txt`, viewFilePath);

          // Search and replace view name
          updateTemplateName(viewFilePath, outputName, nameCaps);
        } else {
          log(`\n${cliName} Error: Cannot create new ${type}. Directory, ${viewPath} already exists.`, 'error', quiet);
          callback(1);
          return 1;
        }
      } catch(error) {
        log(`\n${cliName} Error: Cannot create new ${type}. ${error.message}`, 'error', quiet);
        callback(1);
        return 1;
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
  }

  callback(0);
  return 0;
};
