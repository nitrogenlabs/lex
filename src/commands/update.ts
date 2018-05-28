import chalk from 'chalk';
import {spawnSync, SpawnSyncReturns} from 'child_process';

import {LexConfig} from '../LexConfig';
import {log} from '../utils';

export const update = (cmd) => {
  log(chalk.cyan('Lex updating packages...'), cmd);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  const {packageManager} = LexConfig.config;
  const upgradeOptions: string[] = packageManager === 'npm' ?
    ['update'] :
    ['upgrade-interactive', '--latest'];

  const yarn: SpawnSyncReturns<Buffer> = spawnSync(packageManager, upgradeOptions, {
    encoding: 'utf-8',
    stdio: 'inherit'
  });

  process.exit(yarn.status);
};
