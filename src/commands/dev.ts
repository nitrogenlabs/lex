import chalk from 'chalk';
import {spawnSync} from 'child_process';
import * as path from 'path';
import {LexConfig} from '../LexConfig';

export const dev = (lexConfigFile: string, cmd) => {
  console.log(chalk.blue('Lex development...'));

  // Set node environment
  process.env.NODE_ENV = 'development';

  // Get custom configuration
  const configPath: string = lexConfigFile || './lex.config.js';
  LexConfig.parseConfig(configPath);

  // Get custom webpack configuration file
  const webpackConfig: string = cmd.config || path.resolve(__dirname, `../../webpack.config.ts`);

  // Compile using webpack
  const openDev: string = cmd.open ? '--open' : '';
  const webpackDevPath: string = path
    .resolve(__dirname, '../../node_modules/webpack-dev-server/bin/webpack-dev-server.js');
  const webpack = spawnSync(webpackDevPath, ['--config', webpackConfig, openDev], {
    encoding: 'utf-8',
    stdio: 'inherit'
  });

  process.exit(webpack.status);
};
