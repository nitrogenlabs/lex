import chalk from 'chalk';
import {spawnSync, SpawnSyncReturns} from 'child_process';
import compareVersions from 'compare-versions';
import latestVersion from 'latest-version';
import ora from 'ora';

import {LexConfig} from '../LexConfig';
import {log} from '../utils';
import {parseVersion} from './versions';

const packageConfig = require('../../package.json');

export const upgrade = (cmd) => {
  // Spinner
  const spinner = ora({color: 'yellow'});

  // Display status
  log(chalk.cyan('Upgrading Lex...'), cmd);

  // Start loader
  spinner.start('Updating...\n');

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  latestVersion('@nlabs/lex')
    .then((latest: string) => {
      const current: string = parseVersion(packageConfig.version);
      const versionDiff: number = compareVersions(latest, current);

      if(versionDiff === 0) {
        log(chalk.grey(`Currently up-to-date. Version ${latest} is the latest.`), cmd);
        return;
      }

      log(chalk.grey(`Currently out of date. Upgrading from version ${current} to ${latest}...`), cmd);

      // We will always install @nlabs/lex globally using npm. There is an issue with installing with yarn globally.
      // const {packageManager} = LexConfig.config;
      const packageManager: string = 'npm';

      const upgradeOptions: string[] = packageManager === 'npm' ?
        ['install', '-g', '@nlabs/lex@latest'] :
        ['global', 'add', '@nlabs/lex@latest'];

      const yarn: SpawnSyncReturns<Buffer> = spawnSync(packageManager, upgradeOptions, {
        encoding: 'utf-8',
        stdio: 'inherit'
      });

      // Stop loader
      spinner.succeed('Successfully updated Lex!');

      // Stop process
      process.exit(yarn.status);
    })
    .catch((error) => {
      // Display error message
      log(chalk.red(`Lex Error: ${error.message}.`), cmd);

      // Stop loader
      spinner.fail('Failed to updated packages.');

      // Kill process
      process.exit(1);
    });
};
