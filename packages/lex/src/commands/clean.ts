/**
 * Copyright (c) 2018, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {LexConfig} from '../LexConfig';
import {createSpinner, log, removeFiles, removeModules} from '../utils';

export const clean = async (cmd: any, callback: any = process.exit) => {
  const {cliName = 'Lex', quiet, snapshots} = cmd;

  // Spinner
  const spinner = createSpinner(quiet);

  // Display status
  log(`${cliName} cleaning directory...`, 'info', quiet);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  // Start cleaning spinner
  spinner.start('Cleaning files...');

  try {
    // Remove node_modules
    await removeModules();

    // Remove test coverage reports
    await removeFiles('./coverage', true);

    // Remove yarn logs
    await removeFiles('./yarn-error.log', true);
    await removeFiles('./yarn-debug.log', true);

    // Remove npm logs
    await removeFiles('./npm-debug.log', true);

    if(snapshots) {
      await removeFiles('./**/__snapshots__', true);
    }

    // Stop spinner
    spinner.succeed('Successfully cleaned!');

    // Stop process
    return callback(0);
  } catch(error) {
    // Display error message
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    // Stop spinner
    spinner.fail('Failed to clean project.');

    // Kill process
    return callback(1);
  }
};
