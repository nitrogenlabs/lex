/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {default as execa} from 'execa';
import * as path from 'path';

import {LexConfig} from '../LexConfig';
import {createSpinner, removeFiles} from '../utils/app';
import {relativeFilePath} from '../utils/file';
import {log} from '../utils/log';

export const dev = async (cmd: any, callback: any = () => ({})): Promise<number> => {
  const {bundleAnalyzer, cliName = 'Lex', config, open = false, quiet, remove, variables} = cmd;

  // Spinner
  const spinner = createSpinner(quiet);

  // Display status
  log(`${cliName} start development server...`, 'info', quiet);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  const {outputFullPath, useTypescript} = LexConfig.config;

  // Set node environment variables
  let variablesObj: object = {NODE_ENV: 'development'};

  if(variables) {
    try {
      variablesObj = JSON.parse(variables);
    } catch(error) {
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
  const webpackConfig: string = config || path.resolve(__dirname, '../../webpack.config.js');

  // Compile using webpack
  const webpackOptions: string[] = [
    '--color',
    '--watch',
    '--config', webpackConfig
  ];

  if(bundleAnalyzer) {
    webpackOptions.push('--bundleAnalyzer');
  }

  // Start development spinner
  try {
    const nodePath: string = path.resolve(__dirname, '../../node_modules');
    const webpackPath: string = relativeFilePath('webpack-cli/bin/cli.js', nodePath);
    await execa(webpackPath, webpackOptions, {
      encoding: 'utf-8',
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
    callback(error.status);
    return error.status;
  }
};
