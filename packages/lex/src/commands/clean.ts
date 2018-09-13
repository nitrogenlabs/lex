import path from 'path';
import rimraf from 'rimraf';

import {LexConfig} from '../LexConfig';
import {createSpinner, log} from '../utils';

const cwd: string = process.cwd();
export const removeFiles = (fileName: string, isRelative: boolean = false) => new Promise((resolve, reject) => {
  const filePath: string = isRelative ? path.resolve(cwd, fileName) : fileName;

  rimraf(filePath, (error) => {
    if(error) {
      return reject(error);
    }

    return resolve();
  });
});

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
    await removeFiles('./node_modules', true);

    // Remove test coverage reports
    await removeFiles('./coverage', true);

    // Remove yarn files
    await removeFiles('./yarn.lock', true);
    await removeFiles('./yarn-error.log', true);
    await removeFiles('./yarn-debug.log', true);

    // Remove npm files
    await removeFiles('./package-lock.json', true);
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
