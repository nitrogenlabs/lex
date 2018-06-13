import chalk from 'chalk';
import {spawnSync, SpawnSyncReturns} from 'child_process';
import * as path from 'path';
import rimraf from 'rimraf';

import {LexConfig} from '../LexConfig';
import {log} from '../utils';

export const build = (cmd) => {
  log(chalk.cyan('Lex building...'), cmd);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  const {outputFullPath, useTypescript} = LexConfig.config;

  // Set node environment variables
  let variablesObj: object = {NODE_ENV: 'production'};

  if(cmd.variables) {
    try {
      variablesObj = JSON.parse(cmd.variables);
    } catch(error) {
      log(chalk.red('Lex Error: Environment variables option is not a valid JSON object.'), cmd);
      return process.exit(1);
    }
  }

  process.env = {...process.env, ...variablesObj};

  // Clean output directory before we start adding in new files
  if(cmd.remove) {
    rimraf.sync(outputFullPath);
  }

  // Add tsconfig file if none exists
  if(useTypescript) {
    // Make sure tsconfig.json exists
    LexConfig.checkTypescriptConfig();
  }

  // Get custom webpack configuration
  const webpackConfig: string = cmd.config || path.resolve(__dirname, '../../webpack.config.js');
  const webpackMode: string = cmd.mode || 'production';

  // Compile using webpack
  const webpackPath: string = path.resolve(__dirname, '../../node_modules/webpack-cli/bin/webpack.js');
  const webpack: SpawnSyncReturns<Buffer> = spawnSync(webpackPath, ['--config', webpackConfig, '--mode', webpackMode], {
    encoding: 'utf-8',
    stdio: 'inherit'
  });

  return process.exit(webpack.status);
};
