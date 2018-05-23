import chalk from 'chalk';
import {spawnSync, SpawnSyncReturns} from 'child_process';
import * as path from 'path';

import {LexConfig} from '../LexConfig';
import {log} from '../utils';

export const build = (cmd) => {
  log(chalk.cyan('Lex building...'), cmd);

  // Set node environment
  process.env.NODE_ENV = 'production';

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  const {useTypescript} = LexConfig.config;

  if(useTypescript) {
    // Make sure tsconfig.json exists
    LexConfig.checkTypescriptConfig();
  }

  // Get custom webpack configuration
  const webpackConfig: string = cmd.config || path.resolve(__dirname, `../../webpack.config.js`);
  const webpackMode: string = cmd.mode || 'production';

  // Compile using webpack
  const webpackPath: string = path.resolve(__dirname, '../../node_modules/webpack-cli/bin/webpack.js');
  const webpack: SpawnSyncReturns<Buffer> = spawnSync(webpackPath, ['--config', webpackConfig, '--mode', webpackMode], {
    encoding: 'utf-8',
    stdio: 'inherit'
  });

  process.exit(webpack.status);
};
