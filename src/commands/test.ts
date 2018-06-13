import chalk from 'chalk';
import {spawnSync, SpawnSyncReturns} from 'child_process';
import * as path from 'path';

import {LexConfig} from '../LexConfig';
import {log} from '../utils';

export const test = (cmd) => {
  log(chalk.cyan('Lex testing...'), cmd);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  const {useTypescript} = LexConfig.config;

  if(useTypescript) {
    // Make sure tsconfig.json exists
    LexConfig.checkTypescriptConfig();
  }

  // Configure jest
  const {config, removeCache, setup, update, verbose, watch} = cmd;
  const jestPath: string = path.resolve(__dirname, '../../node_modules/jest/bin/jest.js');
  const jestConfigFile: string = config || path.resolve(__dirname, '../../jest.config.js');
  const jestSetupFile: string = setup || '';
  const jestOptions: string[] = ['--config', jestConfigFile];

  // Clear cache
  if(removeCache) {
    const jestClear: SpawnSyncReturns<Buffer> = spawnSync(jestPath, ['--clearCache'], {
      encoding: 'utf-8',
      stdio: 'inherit'
    });

    if(jestClear.status) {
      return process.exit(jestClear.status);
    }
  }

  if(jestSetupFile !== '') {
    jestOptions.push('--setupTestFrameworkScriptFile', jestSetupFile);
  }

  if(update) {
    jestOptions.push('--updateSnapshot');
  }

  if(verbose === undefined || verbose.toString() === 'true') {
    jestOptions.push('--verbose');
  }

  if(watch) {
    jestOptions.push('--watch');
  }

  // Test app using jest
  const jest: SpawnSyncReturns<Buffer> = spawnSync(jestPath, jestOptions, {
    encoding: 'utf-8',
    stdio: 'inherit'
  });

  return process.exit(jest.status);
};
