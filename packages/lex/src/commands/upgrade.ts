/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import compareVersions from 'compare-versions';
import execa from 'execa';
import latestVersion from 'latest-version';

import {LexConfig} from '../LexConfig';
import {createSpinner, log} from '../utils';
import {parseVersion} from './versions';

const packageConfig = require('../../package.json');

export const upgrade = (cmd: any, callback: any = process.exit): Promise<number> => {
  const {cliName = 'Lex', cliPackage = '@nlabs/lex', quiet} = cmd;

  // Display status
  log(`Upgrading ${cliName}...`, 'info', quiet);

  // Spinner
  const spinner = createSpinner(quiet);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  return latestVersion('@nlabs/lex')
    .then(async (latest: string) => {
      const current: string = parseVersion(packageConfig.version);
      const versionDiff: number = compareVersions(latest, current);

      if(versionDiff === 0) {
        log(`\nCurrently up-to-date. Version ${latest} is the latest.`, 'note', quiet);
        callback(0);
        return 0;
      }

      log(`\nCurrently out of date. Upgrading from version ${current} to ${latest}...`, 'note', quiet);

      // We will always install @nlabs/lex globally using npm. There is an issue with installing with yarn globally.
      // const {packageManager} = LexConfig.config;
      const packageManager: string = 'npm';

      const upgradeOptions: string[] = packageManager === 'npm' ?
        ['install', '-g', `${cliPackage}@latest`] :
        ['global', 'add', `${cliPackage}@latest`];

      const yarn = await execa(packageManager, upgradeOptions, {
        encoding: 'utf-8',
        stdio: 'inherit'
      });

      // Stop loader
      if(!yarn.status) {
        spinner.succeed(`Successfully updated ${cliName}!`);
      } else {
        spinner.fail('Failed to updated packages.');
      }

      // Stop process
      callback(yarn.status);
      return yarn.status;
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
