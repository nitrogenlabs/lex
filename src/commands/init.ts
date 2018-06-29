import chalk from 'chalk';
import {spawnSync, SpawnSyncReturns} from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import {LexConfig} from '../LexConfig';
import {getPackageJson, log, setPackageJson} from '../utils';

export const init = (appName: string, packageName: string, cmd) => {
  const cwd: string = process.cwd();
  let status: number = 0;

  // Download app module into temporary directory
  log(chalk.cyan('Lex downloading app module...'), cmd);
  const tmpPath: string = path.resolve(cwd, './.lexTmp');
  const appPath: string = path.resolve(cwd, `./${appName}`);
  const dnpPath: string = path.resolve(__dirname, '../../node_modules/download-npm-package/bin/cli.js');

  // Get custom configuration
  LexConfig.parseConfig(cmd);
  const {install, cmdPackageManager, typescript} = cmd;
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

  log(chalk.grey('Initializing...'), cmd);

  try {
    const download: SpawnSyncReturns<Buffer> = spawnSync(dnpPath, [appModule, tmpPath], {});
    status += download.status;
  } catch(error) {
    log(chalk.red(`Lex Error: There was an error downloading ${appModule}. Make sure the package exists and there is a network connection.`), cmd);
    return process.exit(1);
  }

  // Move into configured directory
  try {
    fs.renameSync(`${tmpPath}/${appModule}`, appPath);
  } catch(error) {
    log(chalk.red(`Lex Error: There was an error downloading ${appModule}. Make sure the package exists and there is a network connection.`), cmd);
    return process.exit(1);
  }

  // Configure package.json
  const packagePath: string = `${appPath}/package.json`;
  const packageJson = getPackageJson(packagePath);
  packageJson.name = appName;
  packageJson.description = 'Lex created app';
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
    log(chalk.cyan('Lex Error:', error.message), cmd);
    return process.exit(1);
  }

  if(install) {
    log(chalk.grey('Installing dependencies...'), cmd);

    // Change to the app directory
    process.chdir(appPath);

    // Install dependencies
    const install: SpawnSyncReturns<Buffer> = spawnSync(packageManager, ['install'], {
      encoding: 'utf-8',
      stdio: 'inherit'
    });

    status += install.status;
  }

  return process.exit(status);
};
