import compareVersions from 'compare-versions';
import execa from 'execa';
import latestVersion from 'latest-version';

import {LexConfig} from '../LexConfig';
import {createSpinner, log} from '../utils';
import {parseVersion} from './versions';

const packageConfig = require('../../package.json');

export const upgrade = (cmd) => {
  const {quiet} = cmd;

  // Display status
  log('Upgrading Lex...', 'info', quiet);

  // Spinner
  const spinner = createSpinner(quiet);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  latestVersion('@nlabs/lex')
    .then(async (latest: string) => {
      const current: string = parseVersion(packageConfig.version);
      const versionDiff: number = compareVersions(latest, current);

      if(versionDiff === 0) {
        log(`Currently up-to-date. Version ${latest} is the latest.`, 'note', quiet);
        return;
      }

      log(`Currently out of date. Upgrading from version ${current} to ${latest}...`, 'note', quiet);

      // We will always install @nlabs/lex globally using npm. There is an issue with installing with yarn globally.
      // const {packageManager} = LexConfig.config;
      const packageManager: string = 'npm';

      const upgradeOptions: string[] = packageManager === 'npm' ?
        ['install', '-g', '@nlabs/lex@latest'] :
        ['global', 'add', '@nlabs/lex@latest'];

      const yarn = await execa(packageManager, upgradeOptions, {
        encoding: 'utf-8',
        stdio: 'inherit'
      });

      // Stop loader
      if(!yarn.status) {
        spinner.succeed('Successfully updated Lex!');
      } else {
        spinner.fail('Failed to updated packages.');
      }

      // Stop process
      process.exit(yarn.status);
    })
    .catch((error) => {
      // Display error message
      log(`Lex Error: ${error.message}`, 'error', quiet);

      // Stop spinner
      spinner.fail('Failed to updated packages.');

      // Kill process
      process.exit(1);
    });
};
