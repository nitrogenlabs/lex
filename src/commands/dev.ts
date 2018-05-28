import chalk from 'chalk';
import {spawnSync, SpawnSyncReturns} from 'child_process';
import * as path from 'path';

import {LexConfig} from '../LexConfig';
import {log} from '../utils';

export const dev = (cmd) => {
  log(chalk.cyan('Lex development...'), cmd);

  // Set node environment
  process.env.NODE_ENV = 'development';

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  const {useTypescript} = LexConfig.config;

  if(useTypescript) {
    // Make sure tsconfig.json exists
    LexConfig.checkTypescriptConfig();
  }

  // Get custom webpack configuration file
  const webpackConfig: string = cmd.config || path.resolve(__dirname, '../../webpack.config.js');

  // Compile using webpack
  const webpackOptions: string[] = ['--config', webpackConfig];

  if(cmd.open) {
    webpackOptions.push('--open');
  }

  const webpackDevPath: string = path
    .resolve(__dirname, '../../node_modules/webpack-dev-server/bin/webpack-dev-server.js');
  const webpack: SpawnSyncReturns<Buffer> = spawnSync(webpackDevPath, webpackOptions, {
    encoding: 'utf-8',
    stdio: 'inherit'
  });

  process.exit(webpack.status);
};
