import chalk from 'chalk';
import {spawnSync} from 'child_process';
import * as path from 'path';

import {LexConfig} from '../LexConfig';

export const build = (lexConfigFile: string, cmd) => {
  console.log(chalk.cyan('Lex building...'));

  // Set node environment
  process.env.NODE_ENV = 'production';

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  // Get custom webpack configuration
  const webpackConfig: string = cmd.config || path.resolve(__dirname, `../../webpack.config.js`);
  const webpackMode: string = cmd.mode || 'production';

  // Compile using webpack
  const webpackPath: string = path.resolve(__dirname, '../../node_modules/webpack-cli/bin/webpack.js');
  const webpack = spawnSync(webpackPath, ['--config', webpackConfig, '--mode', webpackMode], {
    encoding: 'utf-8',
    stdio: 'inherit'
  });

  process.exit(webpack.status);
};
