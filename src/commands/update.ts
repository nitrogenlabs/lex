import chalk from 'chalk';
import {spawnSync, SpawnSyncReturns} from 'child_process';
import ora from 'ora';

import {LexConfig} from '../LexConfig';
import {log} from '../utils';

export const update = (cmd) => {
  // Spinner
  const spinner = ora({color: 'yellow'});

  // Display status
  log(chalk.cyan('Lex updating packages...'), cmd);

  // Start loader
  spinner.start('Updating...\n');

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  const {packageManager: cmdPackageManager} = cmd;
  const {packageManager: configPackageManager} = LexConfig.config;
  const packageManager: string = cmdPackageManager || configPackageManager;

  const upgradeOptions: string[] = packageManager === 'npm' ?
    ['update'] :
    [cmd.interactive ? 'upgrade-interactive' : 'upgrade', '--latest'];

  const pm: SpawnSyncReturns<Buffer> = spawnSync(packageManager, upgradeOptions, {
    encoding: 'utf-8',
    stdio: 'inherit'
  });

  // Stop loader
  if(!pm.status) {
    spinner.succeed('Successfully updated packages!');
  } else {
    spinner.fail('Failed to updated packages.');
  }

  process.exit(pm.status);
};
