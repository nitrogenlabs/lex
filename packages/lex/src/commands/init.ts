/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import {renameSync, writeFileSync} from 'fs';
import {resolve as pathResolve} from 'path';
import {fileURLToPath} from 'url';

import {LexConfig} from '../LexConfig.js';
import {createSpinner, getPackageJson, setPackageJson} from '../utils/app.js';
import {log} from '../utils/log.js';

export const init = async (
  appName: string,
  packageName: string,
  cmd: any,
  callback: any = () => ({})
): Promise<number> => {
  const {cliName = 'Lex', install, packageManager: cmdPackageManager, quiet, typescript} = cmd;
  const cwd: string = process.cwd();

  // Spinner
  const spinner = createSpinner(quiet);

  // Download app module into temporary directory
  log(`${cliName} is downloading the app module...`, 'info', quiet);
  spinner.start('Downloading app...');
  const tmpPath: string = pathResolve(cwd, './.lexTmp');
  const appPath: string = pathResolve(cwd, `./${appName}`);
  const dirName = fileURLToPath(new URL('.', import.meta.url));
  const dnpPath: string = pathResolve(dirName, '../../node_modules/download-npm-package/bin/cli.js');

  // Get custom configuration
  await LexConfig.parseConfig(cmd);
  const {packageManager: configPackageManager, useTypescript: configTypescript} = LexConfig.config;
  const packageManager: string = cmdPackageManager || configPackageManager;
  const useTypescript: boolean = typescript !== undefined ? typescript : configTypescript;

  let appModule: string = packageName;

  // Use base app module based on config
  if(!appModule) {
    if(useTypescript) {
      appModule = '@nlabs/arkhamjs-example-ts-react';
    } else {
      appModule = '@nlabs/arkhamjs-example-flow-react';
    }
  }

  try {
    await execa(dnpPath, [appModule, tmpPath], {});

    // Stop spinner and update status
    spinner.succeed('Successfully downloaded app!');
  } catch(error) {
    console.log('error', error);
    log(`\n${cliName} Error: There was an error downloading ${appModule}. Make sure the package exists and there is a network connection.`, 'error', quiet);

    // Stop spinner and kill process
    spinner.fail('Downloaded of app failed.');

    // Kill process
    callback(error.status);
    return error.status;
  }

  // Move into configured directory
  try {
    renameSync(`${tmpPath}/${appModule}`, appPath);
  } catch(error) {
    log(`\n${cliName} Error: There was an error copying ${appModule} to the current working directory.`, 'error', quiet);
    callback(error.status);
    return error.status;
  }

  // Configure package.json
  const packagePath: string = `${appPath}/package.json`;
  const packageJson = getPackageJson(packagePath);
  packageJson.name = appName;
  packageJson.description = `${cliName} created app`;
  packageJson.version = '0.1.0';
  delete packageJson.keywords;
  delete packageJson.author;
  delete packageJson.contributors;
  delete packageJson.repository;
  delete packageJson.homepage;
  delete packageJson.bugs;

  try {
    // Update package.json
    setPackageJson(packageJson, packagePath);

    // Update README
    const readmePath: string = `${appPath}/README.md`;
    writeFileSync(readmePath, `# ${appName}`);
  } catch(error) {
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);
    callback(error.status);
    return error.status;
  }

  if(install) {
    spinner.start('Installing dependencies...');

    // Change to the app directory
    process.chdir(appPath);

    // Install dependencies
    try {
      await execa(packageManager, ['install'], {
        encoding: 'utf-8',
        stdio: 'inherit'
      });

      // Stop spinner
      spinner.succeed('Successfully installed dependencies!');
    } catch(error) {
      // Display error message
      log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

      // Stop spinner
      spinner.fail('Failed to install dependencies.');

      // Kill process
      callback(error.status);
      return error.status;
    }
  }

  // Kill process
  callback(0);
  return 0;
};
