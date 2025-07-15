/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import {resolve as pathResolve} from 'path';
import {URL} from 'url';

import {LexConfig} from '../../LexConfig.js';
import {createSpinner, removeFiles} from '../../utils/app.js';
import {resolveBinaryPath} from '../../utils/file.js';
import {log} from '../../utils/log.js';

export interface DevOptions {
  readonly bundleAnalyzer?: boolean;
  readonly cliName?: string;
  readonly config?: string;
  readonly open?: boolean;
  readonly quiet?: boolean;
  readonly remove?: boolean;
  readonly variables?: string;
}

export type DevCallback = (status: number) => void;

export const dev = async (cmd: DevOptions, callback: DevCallback = () => ({})): Promise<number> => {
  const {bundleAnalyzer, cliName = 'Lex', config, open = false, quiet, remove, variables} = cmd;

  // Spinner
  const spinner = createSpinner(quiet);

  // Display status
  log(`${cliName} start development server...`, 'info', quiet);

  // Get custom configuration
  await LexConfig.parseConfig(cmd);

  const {outputFullPath, useTypescript} = LexConfig.config;

  // Set node environment variables
  let variablesObj: object = {NODE_ENV: 'development'};

  if(variables) {
    try {
      variablesObj = JSON.parse(variables);
    } catch(_error) {
      log(`\n${cliName} Error: Environment variables option is not a valid JSON object.`, 'error', quiet);
      callback(1);
      return 1;
    }
  }

  process.env = {...process.env, ...variablesObj};

  if(useTypescript) {
    // Make sure tsconfig.json exists
    LexConfig.checkTypescriptConfig();
  }

  // Clean output directory before we start adding in new files
  if(remove) {
    // Start cleaning spinner
    spinner.start('Cleaning output directory...');

    // Clean
    await removeFiles(outputFullPath);

    // Stop spinner
    spinner.succeed('Successfully cleaned output directory!');
  }

  // Get custom webpack configuration file
  const dirName = new URL('.', import.meta.url).pathname;
  const webpackConfig: string = config || pathResolve(dirName, '../../../webpack.config.js');

  // Compile using webpack
  const webpackOptions: string[] = [
    '--color',
    '--watch',
    '--config', webpackConfig
  ];

  if(bundleAnalyzer) {
    webpackOptions.push('--bundleAnalyzer');
  }

  try {
    // Use robust path resolution for webpack binary
    const webpackPath = resolveBinaryPath('webpack-cli');

    // Check if webpack binary exists
    if(!webpackPath) {
      log(`\n${cliName} Error: webpack-cli binary not found in Lex's node_modules or monorepo root`, 'error', quiet);
      log('Please reinstall Lex or check your installation.', 'info', quiet);
      return 1;
    }
    // @ts-ignore
    await execa(webpackPath, webpackOptions, {
      encoding: 'utf8',
      env: {
        LEX_QUIET: quiet,
        WEBPACK_DEV_OPEN: open
      },
      stdio: 'inherit'
    });

    // Stop spinner
    spinner.succeed('Development server started.');

    callback(0);
    return 0;
  } catch(error) {
    // Display error message
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    // Stop spinner
    spinner.fail('There was an error while running Webpack.');

    // Kill process
    callback(1);
    return 1;
  }
};