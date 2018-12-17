/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import execa from 'execa';

import {LexConfig} from '../LexConfig';
import {createSpinner, log} from '../utils';

export const update = async (cmd: any, callback: any = process.exit): Promise<number> => {
  const {cliName = 'Lex', packageManager: cmdPackageManager, quiet, registry} = cmd;

  // Display status
  log(`${cliName} updating packages...`, 'info', quiet);

  // Spinner
  const spinner = createSpinner(quiet);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  const {packageManager: configPackageManager} = LexConfig.config;
  const packageManager: string = cmdPackageManager || configPackageManager;

  const upgradeOptions: string[] = packageManager === 'npm' ?
    ['update'] :
    [cmd.interactive ? 'upgrade-interactive' : 'upgrade', '--latest'];

  if(registry) {
    upgradeOptions.push('--registry', registry);
  }

  try {
    const pm = await execa(packageManager, upgradeOptions, {
      encoding: 'utf-8',
      stdio: 'inherit'
    });

    // Stop loader
    if(!pm.status) {
      spinner.succeed('Successfully updated packages!');
    } else {
      spinner.fail('Failed to updated packages.');
    }

    // Kill process
    callback(pm.status);
    return pm.status;
  } catch(error) {
    // Display error message
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    // Stop spinner
    spinner.fail('Failed to updated packages.');

    // Kill process
    callback(1);
    return 1;
  }
};
