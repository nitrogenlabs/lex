import execa from 'execa';
import * as path from 'path';

import {LexConfig} from '../LexConfig';
import {createSpinner, log, relativeFilePath, removeFiles} from '../utils';

export const dev = async (cmd: any, callback: any = process.exit) => {
  const {cliName = 'Lex', config, open, quiet, remove, variables} = cmd;

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
      return callback(1);
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
  const webpackOptions: string[] = ['--config', webpackConfig];

  if(open) {
    webpackOptions.push('--open');
  }

  // Start development spinner
  try {
    const nodePath: string = path.resolve(__dirname, '../../node_modules');
    const webpackDevPath: string = relativeFilePath('webpack-dev-server/bin/webpack-dev-server.js', nodePath);
    const webpack = await execa(webpackDevPath, webpackOptions, {
      encoding: 'utf-8',
      stdio: 'inherit'
    });

    // Stop spinner
    if(!webpack.status) {
      spinner.succeed('Development server stopped.');
    } else {
      spinner.fail('There was an error while running Webpack.');
    }

    return callback(webpack.status);
  } catch(error) {
    // Display error message
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    // Stop spinner
    spinner.fail('There was an error while running Webpack.');

    // Kill process
    return callback(1);
  }
};
