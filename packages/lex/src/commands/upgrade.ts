/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {compareVersions} from 'compare-versions';
import {execa} from 'execa';
import latestVersion from 'latest-version';

import packageJson from '../../package.json' assert {type: 'json'};
import {LexConfig} from '../LexConfig.js';
import {createSpinner} from '../utils/app.js';
import {log} from '../utils/log.js';
import {parseVersion} from './versions.js';

export const upgrade = async (cmd: any, callback: any = process.exit): Promise<number> => {
  const {cliName = 'Lex', cliPackage = '@nlabs/lex', quiet} = cmd;

  // Display status
  log(`Upgrading ${cliName}...`, 'info', quiet);

  // Spinner
  const spinner = createSpinner(quiet);

  // Get custom configuration
  await LexConfig.parseConfig(cmd);

  return latestVersion('@nlabs/lex')
    .then(async (latest: string) => {
      const current: string = parseVersion(packageJson.version);
      const versionDiff: number = compareVersions(latest, current);

      if(versionDiff === 0) {
        log(`\nCurrently up-to-date. Version ${latest} is the latest.`, 'note', quiet);
        callback(0);
        return 0;
      }

      log(`\nCurrently out of date. Upgrading from version ${current} to ${latest}...`, 'note', quiet);

      const upgradeOptions: string[] = ['install', '-g', `${cliPackage}@latest`];

      await execa('npm', upgradeOptions, {
        encoding: 'utf8',
        stdio: 'inherit'
      });

      // Stop loader
      spinner.succeed(`Successfully updated ${cliName}!`);

      // Stop process
      callback(0);
      return 0;
    })
    .catch((error) => {
      // Display error message
      log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

      // Stop spinner
      spinner.fail('Failed to updated packages.');

      // Kill process
      callback(1);
      return 1;
    });
};
