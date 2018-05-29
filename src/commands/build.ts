import chalk from 'chalk';
import {spawnSync, SpawnSyncReturns} from 'child_process';
import * as path from 'path';
import rimraf from 'rimraf';

import {LexConfig} from '../LexConfig';
import {log} from '../utils';

export const build = (cmd) => {
  const cwd: string = process.cwd();
  log(chalk.cyan('Lex building...'), cmd);

  // Set node environment
  process.env.NODE_ENV = 'production';

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  const {outputDir, useTypescript} = LexConfig.config;

  // Clean output directory before we start adding in new files
  if(cmd.remove) {
    rimraf.sync(path.resolve(cwd, outputDir));
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

  process.exit(webpack.status);
};
