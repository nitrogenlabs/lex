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
  const updateApp: string = packageManager === 'npm' ? 'npx' : 'yarn';
  const updateOptions: string[] = packageManager === 'npm'
    ? ['npx', 'npm-check-updates', '-u', '-n', '-t', '--pre', '0', cmd.interactive ? '-i' : '']
    : [cmd.interactive ? 'upgrade-interactive' : 'upgrade', '--latest'];

  if(registry) {
    updateOptions.push('--registry', registry);
  }

  try {
    await execa(updateApp, updateOptions, {
      encoding: 'utf-8',
      stdio: 'inherit'
    });

    if(packageManager === 'npm') {
      await execa('npm', ['i'], {
        encoding: 'utf-8',
        stdio: 'inherit'
      });

      await execa('npm', ['audit', 'fix'], {
        encoding: 'utf-8',
        stdio: 'inherit'
      });
    }

    // Stop loader
    spinner.succeed('Successfully updated packages!');

    // Kill process
    callback(0);
    return 0;
  } catch(error) {
    // Display error message
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    // Stop spinner
    spinner.fail('Failed to updated packages.');

    // Kill process
    callback(error.status);
    return error.status;
  }
};
