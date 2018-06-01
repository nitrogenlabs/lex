import chalk from 'chalk';
import path from 'path';
import rimraf from 'rimraf';

import {LexConfig} from '../LexConfig';
import {log} from '../utils';

export const clean = (cmd) => {
  const cwd: string = process.cwd();
  log(chalk.cyan('Lex cleaning directory...'), cmd);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

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

    process.exit(0);
  } catch(error) {
    log(chalk.red('Lex Error:', error.message), cwd);
    process.exit(1);
  }
};
