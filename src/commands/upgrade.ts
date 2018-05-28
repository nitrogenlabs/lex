import chalk from 'chalk';
import {spawnSync, SpawnSyncReturns} from 'child_process';
import compareVersions from 'compare-versions';
import latestVersion from 'latest-version';

import {LexConfig} from '../LexConfig';
import {log} from '../utils';
import {parseVersion} from './versions';

const packageConfig = require('../../package.json');

export const upgrade = (cmd) => {
  log(chalk.cyan('Upgrading Lex...'), cmd);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  latestVersion('@nlabs/lex')
    .then((latest: string) => {
      const current: string = parseVersion(packageConfig.version);
      const versionDiff: number = compareVersions(latest, current);

      if(versionDiff >= 0) {
        log(chalk.grey(`Currently up-to-date. Version ${current} is the latest.`), cmd);
        return;
      }

      log(chalk.grey(`Currently out of date. Upgrading from version ${current} to ${latest}...`), cmd);

      const {packageManager} = LexConfig.config;
      const upgradeOptions: string[] = packageManager === 'npm' ?
        ['install', '-g', '@nlabs/lex@latest'] :
        ['global', 'add', '@nlabs/lex@latest'];

      const yarn: SpawnSyncReturns<Buffer> = spawnSync(packageManager, upgradeOptions, {
        encoding: 'utf-8',
        stdio: 'inherit'
      });

      process.exit(yarn.status);
    })
    .catch((error) => {
      log(chalk.red(`Lex Error: ${error.message}.`), cmd);
      process.exit(1);
    });
};
