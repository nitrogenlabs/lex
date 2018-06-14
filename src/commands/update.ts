import chalk from 'chalk';
import {spawnSync, SpawnSyncReturns} from 'child_process';

import {LexConfig} from '../LexConfig';
import {log} from '../utils';

export const update = (cmd) => {
  log(chalk.cyan('Lex updating packages...'), cmd);

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

  process.exit(pm.status);
};
