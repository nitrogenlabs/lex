/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import {resolve as pathResolve} from 'path';

import {LexConfig} from '../../LexConfig.js';
import {createSpinner} from '../../utils/app.js';
import {log} from '../../utils/log.js';

export interface UpdateOptions {
  readonly cliName?: string;
  readonly interactive?: boolean;
  readonly packageManager?: string;
  readonly quiet?: boolean;
  readonly registry?: string;
}

export type UpdateCallback = typeof process.exit;

export const update = async (cmd: UpdateOptions, callback: UpdateCallback = process.exit): Promise<number> => {
  const {cliName = 'Lex', packageManager: cmdPackageManager, quiet, registry} = cmd;

  log(`${cliName} updating packages...`, 'info', quiet);

  const spinner = createSpinner(quiet);

  await LexConfig.parseConfig(cmd);

  const {packageManager: configPackageManager} = LexConfig.config;
  const packageManager: string = cmdPackageManager || configPackageManager || 'npm';
  const isNpm: boolean = packageManager === 'npm';
  const updateApp: string = isNpm ? 'npx' : 'yarn';
  const dirName = new URL('.', import.meta.url).pathname;
  const dirPath: string = pathResolve(dirName, '../..');
  
  const updateOptions: string[] = isNpm
    ? [
      'npm-check-updates',
      '--concurrency', '10',
      '--packageManager', packageManager,
      '--pre', '0',
      '--target', 'latest',
      ...(cmd.interactive ? ['--interactive'] : []),
      '--upgrade'
    ]
    : [cmd.interactive ? 'upgrade-interactive' : 'upgrade', '--latest'];

  if(registry) {
    updateOptions.push('--registry', registry);
  }

  try {
    await execa(updateApp, updateOptions, {
      encoding: 'utf8',
      stdio: 'inherit'
    });

    if(isNpm) {
      await execa('npm', ['i', '--force'], {
        encoding: 'utf8',
        stdio: 'inherit'
      });

      await execa('npm', ['audit', 'fix'], {
        encoding: 'utf8',
        stdio: 'inherit'
      });
    }

    spinner.succeed('Successfully updated packages!');

    callback(0);
    return 0;
  } catch(error) {
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    spinner.fail('Failed to updated packages.');

    callback(1);
    return 1;
  }
};