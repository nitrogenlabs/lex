import chalk from 'chalk';
import {spawnSync, SpawnSyncReturns} from 'child_process';
import * as path from 'path';
import rimraf from 'rimraf';

import {LexConfig} from '../LexConfig';
import {log} from '../utils';

export const dev = (cmd) => {
  log(chalk.cyan('Lex start development server...'), cmd);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  const {outputFullPath, useTypescript} = LexConfig.config;

  // Set node environment variables
  let variablesObj: object = {NODE_ENV: 'development'};

  if(cmd.variables) {
    try {
      variablesObj = JSON.parse(cmd.variables);
    } catch(error) {
      log(chalk.red('Lex Error: Environment variables option is not a valid JSON object.'), cmd);
      return process.exit(1);
    }
  }

  process.env = {...process.env, ...variablesObj};

  if(useTypescript) {
    // Make sure tsconfig.json exists
    LexConfig.checkTypescriptConfig();
  }

  // Clean output directory before we start adding in new files
  if(cmd.remove) {
    log(chalk.grey('Cleaning output directory...'), cmd);
    rimraf.sync(outputFullPath);
  }

  // Get custom webpack configuration file
  const webpackConfig: string = cmd.config || path.resolve(__dirname, '../../webpack.config.js');

  // Compile using webpack
  const webpackOptions: string[] = ['--config', webpackConfig];

  if(cmd.open) {
    webpackOptions.push('--open');
  }

  const webpackDevPath: string = path.resolve(
    __dirname, '../../node_modules/webpack-dev-server/bin/webpack-dev-server.js'
  );

  log(chalk.grey('Starting development server...'), cmd);
  const webpack: SpawnSyncReturns<Buffer> = spawnSync(webpackDevPath, webpackOptions, {
    encoding: 'utf-8',
    stdio: 'inherit'
  });

  if(!webpack.status) {
    log(chalk.red('Lex Error: There was an error while running Webpack.'), cmd);
  }

  return process.exit(webpack.status);
};
