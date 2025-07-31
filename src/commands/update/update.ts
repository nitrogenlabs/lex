/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';

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

  try {
    if(isNpm) {
      let ncuCommand: string;
      let ncuArgs: string[];

      try {
        ncuCommand = 'npx';
        ncuArgs = [
          'npm-check-updates',
          '--concurrency', '10',
          '--packageManager', packageManager,
          '--pre', '0',
          '--target', 'latest',
          ...(cmd.interactive ? ['--interactive'] : []),
          '--upgrade'
        ];

        if(registry) {
          ncuArgs.push('--registry', registry);
        }

        await execa(ncuCommand, ncuArgs, {
          encoding: 'utf8',
          stdio: 'inherit'
        });
      } catch {
        try {
          ncuCommand = 'npm-check-updates';
          ncuArgs = [
            '--concurrency', '10',
            '--packageManager', packageManager,
            '--pre', '0',
            '--target', 'latest',
            ...(cmd.interactive ? ['--interactive'] : []),
            '--upgrade'
          ];

          if(registry) {
            ncuArgs.push('--registry', registry);
          }

          await execa(ncuCommand, ncuArgs, {
            encoding: 'utf8',
            stdio: 'inherit'
          });
        } catch {
          log('npm-check-updates not found. Installing it globally...', 'info', quiet);

          try {
            await execa('npm', ['install', '-g', 'npm-check-updates'], {
              encoding: 'utf8',
              stdio: 'inherit'
            });

            ncuCommand = 'npm-check-updates';
            ncuArgs = [
              '--concurrency', '10',
              '--packageManager', packageManager,
              '--pre', '0',
              '--target', 'latest',
              ...(cmd.interactive ? ['--interactive'] : []),
              '--upgrade'
            ];

            if(registry) {
              ncuArgs.push('--registry', registry);
            }

            await execa(ncuCommand, ncuArgs, {
              encoding: 'utf8',
              stdio: 'inherit'
            });
          } catch (installError) {
            log(`Failed to install or use npm-check-updates: ${installError.message}`, 'error', quiet);
            log('Please install npm-check-updates manually: npm install -g npm-check-updates', 'info', quiet);
            throw installError;
          }
        }
      }

      // After successful update, run npm install and audit fix
      await execa('npm', ['i', '--force'], {
        encoding: 'utf8',
        stdio: 'inherit'
      });

      await execa('npm', ['audit', 'fix'], {
        encoding: 'utf8',
        stdio: 'inherit'
      });
    } else {
      // Use yarn
      const updateApp = 'yarn';
      const updateOptions: string[] = [cmd.interactive ? 'upgrade-interactive' : 'upgrade', '--latest'];

      if(registry) {
        updateOptions.push('--registry', registry);
      }

      await execa(updateApp, updateOptions, {
        encoding: 'utf8',
        stdio: 'inherit'
      });
    }

    spinner.succeed('Successfully updated packages!');

    callback(0);
    return 0;
  } catch (error) {
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    spinner.fail('Failed to update packages.');

    callback(1);
    return 1;
  }
};