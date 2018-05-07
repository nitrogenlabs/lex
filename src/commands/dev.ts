import chalk from 'chalk';
import {spawnSync} from 'child_process';
import * as path from 'path';

import {LexConfig} from '../LexConfig';

export const dev = (lexConfigFile: string, cmd) => {
  console.log(chalk.cyan('Lex development...'));

  // Set node environment
  process.env.NODE_ENV = 'development';

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  // Get custom webpack configuration file
  const webpackConfig: string = cmd.config || path.resolve(__dirname, `../../webpack.config.js`);

  // Compile using webpack
  const webpackOptions: string[] = ['--config', webpackConfig];

  if(cmd.open) {
    webpackOptions.push('--open');
  }

  const webpackDevPath: string = path
    .resolve(__dirname, '../../node_modules/webpack-dev-server/bin/webpack-dev-server.js');
  const webpack = spawnSync(webpackDevPath, webpackOptions, {
    encoding: 'utf-8',
    stdio: 'inherit'
  });

  process.exit(webpack.status);
};
