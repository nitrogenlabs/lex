import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import rimraf from 'rimraf';

import {LexConfig} from '../LexConfig';
import {log} from '../utils';

export const clean = (cmd) => {
  // Spinner
  const spinner = ora({color: 'yellow'});

  // Display status
  const cwd: string = process.cwd();
  log(chalk.cyan('Lex cleaning directory...'), cmd);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  // Start cleaning spinner
  spinner.start('Cleaning files...\n');

  try {
    // Remove node_modules
    rimraf.sync(path.resolve(cwd, './node_modules'));

    // Remove test coverage reports
    rimraf.sync(path.resolve(cwd, './coverage'));

    // Remove yarn files
    rimraf.sync(path.resolve(cwd, './yarn.lock'));
    rimraf.sync(path.resolve(cwd, './yarn-error.log'));
    rimraf.sync(path.resolve(cwd, './yarn-debug.log'));

    // Remove npm files
    rimraf.sync(path.resolve(cwd, './package-lock.json'));
    rimraf.sync(path.resolve(cwd, './npm-debug.log'));

    if(cmd.snapshots) {
      rimraf.sync(path.resolve(cwd, './**/__snapshots__'));
    }

    // Stop spinner
    spinner.succeed('Successfully cleaned!');

    // Stop process
    process.exit(0);
  } catch(error) {
    log(chalk.red('Lex Error:', error.message), cmd);

    // Stop spinner
    spinner.fail('Failed to clean project.');

    // Kill process
    process.exit(1);
  }
};
