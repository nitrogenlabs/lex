import chalk from 'chalk';
import {spawnSync, SpawnSyncReturns} from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import {LexConfig} from '../LexConfig';
import {log} from '../utils';

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
  const {packageManager, useTypescript} = LexConfig.config;

  let appModule: string = packageName;

  // Use base app module based on config
  if(!appModule) {
    if(useTypescript) {
      appModule = '@nlabs/arkhamjs-example-ts-react';
    } else {
      appModule = '@nlabs/arkhamjs-example-flow-react';
    }
  }

  const download: SpawnSyncReturns<Buffer> = spawnSync(dnpPath, [packageName, tmpPath], {
    encoding: 'utf-8',
    stdio: 'inherit'
  });

  status += download.status;

  log(chalk.cyan('Lex initializing...'), cmd);

  // Move into configured directory
  try {
    fs.renameSync(`${tmpPath}/${packageName}`, appPath);
  } catch(error) {
    log(chalk.cyan('Lex Error:', error.message), cmd);
    status += 1;
  }

  // Configure package.json
  const packagePath: string = `${appPath}/package.json`;
  const packageData: string = fs.readFileSync(packagePath).toString();
  const packageJson = JSON.parse(packageData);
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
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

    // Update README
    const readmePath: string = `${appPath}/README.md`;
    fs.writeFileSync(readmePath, `# ${appName}`);
  } catch(error) {
    log(chalk.cyan('Lex Error:', error.message), cmd);
    status += 1;
  }

  if(cmd.install) {
    // Change to the app directory
    process.chdir(appPath);

    // Install dependencies
    const install: SpawnSyncReturns<Buffer> = spawnSync(packageManager, ['install'], {
      encoding: 'utf-8',
      stdio: 'inherit'
    });

    status += install.status;
  }

  process.exit(status);
};
