/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';

import {LexConfig} from '../LexConfig.js';
import {createSpinner} from '../utils/app.js';
import {log} from '../utils/log.js';

export const update = async (cmd: any, callback: any = process.exit): Promise<number> => {
  const {cliName = 'Lex', packageManager: cmdPackageManager, quiet, registry} = cmd;

  // Display status
  log(`${cliName} updating packages...`, 'info', quiet);

  // Spinner
  const spinner = createSpinner(quiet);

  // Get custom configuration
  await LexConfig.parseConfig(cmd);

  const {packageManager: configPackageManager} = LexConfig.config;
  const packageManager: string = cmdPackageManager || configPackageManager || 'npm';
  const isNpm: boolean = packageManager === 'npm';
  const updateApp: string = isNpm ? 'npx' : 'yarn';
  const updateOptions: string[] = isNpm
    ? ['npm-check-updates',
      '--concurrency', '10',
      '--packageManager', packageManager,
      '--pre', '0',
      '--target', 'latest',
      cmd.interactive ? '--interactive' : '',
      '--upgrade'
    ]
    : [cmd.interactive ? 'upgrade-interactive' : 'upgrade', '--latest'];

  if(registry) {
    updateOptions.push('--registry', registry);
  }

  try {
    await execa(updateApp, updateOptions, {
      encoding: 'utf8',
      stdio: 'inherit'
    });

    if(isNpm) {
      await execa('npm', ['i', '--force'], {
        encoding: 'utf8',
        stdio: 'inherit'
      });

      await execa('npm', ['audit', 'fix'], {
        encoding: 'utf8',
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
    callback(1);
    return 1;
  }
};
