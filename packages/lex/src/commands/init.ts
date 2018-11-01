/**
 * Copyright (c) 2018, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import execa from 'execa';
import * as fs from 'fs';
import * as path from 'path';

import {LexConfig} from '../LexConfig';
import {createSpinner, getPackageJson, log, setPackageJson} from '../utils';

export const init = async (appName: string, packageName: string, cmd: any, callback: any = process.exit) => {
  const {cliName = 'Lex', install, packageManager: cmdPackageManager, quiet, typescript} = cmd;
  const cwd: string = process.cwd();
  let status: number = 0;

  // Spinner
  const spinner = createSpinner(quiet);

  // Download app module into temporary directory
  log(`${cliName} is downloading the app module...`, 'info', quiet);
  spinner.start('Downloading app...');
  const tmpPath: string = path.resolve(cwd, './.lexTmp');
  const appPath: string = path.resolve(cwd, `./${appName}`);
  const dnpPath: string = path.resolve(__dirname, '../../node_modules/download-npm-package/bin/cli.js');

  // Get custom configuration
  LexConfig.parseConfig(cmd);
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
    const download = await execa(dnpPath, [appModule, tmpPath], {});

    // Stop spinner and update status
    status += download.status;
    spinner.succeed('Successfully downloaded app!');
  } catch(error) {
    console.log('error', error);
    log(`\n${cliName} Error: There was an error downloading ${appModule}. Make sure the package exists and there is a network connection.`, 'error', quiet);

    // Stop spinner and kill process
    spinner.fail('Downloaded of app failed.');

    // Kill process
    return callback(1);
  }

  // Move into configured directory
  try {
    fs.renameSync(`${tmpPath}/${appModule}`, appPath);
  } catch(error) {
    log(`\n${cliName} Error: There was an error downloading ${appModule}. Make sure the package exists and there is a network connection.`, 'error', quiet);
    return callback(1);
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
    fs.writeFileSync(readmePath, `# ${appName}`);
  } catch(error) {
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);
    return callback(1);
  }

  if(install) {
    spinner.start('Installing dependencies...');

    // Change to the app directory
    process.chdir(appPath);

    // Install dependencies
    try {
      const install = await execa(packageManager, ['install'], {
        encoding: 'utf-8',
        stdio: 'inherit'
      });

      // Stop spinner
      if(!install.status) {
        spinner.succeed('Successfully installed dependencies!');
      } else {
        spinner.fail('Failed to install dependencies.');
      }

      status += install.status;
    } catch(error) {
      // Display error message
      log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

      // Stop spinner
      spinner.fail('Failed to install dependencies.');

      // Kill process
      return callback(1);
    }
  }

  // Kill process
  return callback(status);
};
