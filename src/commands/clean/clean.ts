/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {LexConfig} from '../../LexConfig.js';
import {createSpinner, removeFiles, removeModules} from '../../utils/app.js';
import {log} from '../../utils/log.js';

export interface CleanOptions {
  readonly cliName?: string;
  readonly quiet?: boolean;
  readonly snapshots?: boolean;
}

export type CleanCallback = (status: number) => void;

export const clean = async (cmd: CleanOptions, callback: CleanCallback = (_status: number) => ({})): Promise<number> => {
  const {cliName = 'Lex', quiet, snapshots} = cmd;

  // Spinner
  const spinner = createSpinner(quiet);

  // Display status
  log(`${cliName} cleaning directory...`, 'info', quiet);

  // Get custom configuration
  await LexConfig.parseConfig(cmd);

  // Start cleaning spinner
  if(spinner) {
    spinner.start('Cleaning files...');
  }

  try {
    // Remove node_modules
    await removeModules();

    // Remove test coverage reports
    await removeFiles('./coverage', true);

    // Remove npm logs
    await removeFiles('./npm-debug.log', true);

    if(snapshots) {
      await removeFiles('./**/__snapshots__', true);
    }

    // Stop spinner
    if(spinner) {
      spinner.succeed('Successfully cleaned!');
    }

    // Stop process
    callback(0);
    return 0;
  } catch (error) {
    // Display error message
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    // Stop spinner
    if(spinner) {
      spinner.fail('Failed to clean project.');
    }

    // Kill process
    callback(1);
    return 1;
  }
};