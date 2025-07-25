/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';

import {LexConfig} from '../../LexConfig.js';
import {createSpinner, getPackageJson, removeConflictModules, removeModules} from '../../utils/app.js';
import {log} from '../../utils/log.js';

export interface MigrateOptions {
  readonly cliName?: string;
  readonly packageManager?: string;
  readonly quiet?: boolean;
}

export type MigrateCallback = typeof process.exit;

export const migrate = async (cmd: MigrateOptions, callback: MigrateCallback = process.exit): Promise<number> => {
  const {cliName = 'Lex', packageManager: cmdPackageManager, quiet} = cmd;

  const cwd: string = process.cwd();

  // // Display message
  // log(`${cliName} copying "${to}"...`, 'info', quiet);

  // Spinner
  const spinner = createSpinner(quiet);
  spinner.start('Removing node modules...');

  // Remove node_modules
  await removeModules();

  const {packageManager: configPackageManager} = LexConfig.config;
  const packageManager: string = cmdPackageManager || configPackageManager || '';
  const packagePath: string = `${cwd}/package.json`;
  const appPackage = getPackageJson(packagePath);
  const {dependencies = {}, devDependencies = {}} = appPackage;

  // Remove ESBuild, Jest and Webpack from app since it will conflict
  appPackage.dependencies = removeConflictModules(dependencies);
  appPackage.devDependencies = removeConflictModules(devDependencies);

  // Install new list of packages
  try {
    await execa(packageManager, ['install'], {
      encoding: 'utf8',
      stdio: 'inherit'
    });

    // Stop loader
    spinner.succeed('Successfully migrated app!');

    // Kill process
    callback(0);
    return 0;
  } catch(error) {
    // Display error message
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    // Stop spinner
    spinner.fail('Failed to remove modules.');

    // Kill process
    callback(1);
    return 1;
  }
};