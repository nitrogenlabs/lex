import chalk from 'chalk';
import {spawnSync, SpawnSyncReturns} from 'child_process';
import * as path from 'path';

import {LexConfig} from '../LexConfig';

export const test = (cmd) => {
  console.log(chalk.cyan('Lex testing...'));

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  const {useTypescript} = LexConfig.config;

  if(useTypescript) {
    // Make sure tsconfig.json exists
    LexConfig.checkTypescriptConfig();
  }

  // Configure jest
  const jestPath: string = path.resolve(__dirname, '../../node_modules/jest/bin/jest.js');
  const jestConfigFile: string = cmd.config || path.resolve(__dirname, '../../jest.config.js');
  const jestSetupFile: string = cmd.setup || '';
  const jestOptions: string[] = ['--config', jestConfigFile];

  if(jestSetupFile !== '') {
    jestOptions.push('--setupTestFrameworkScriptFile', jestSetupFile);
  }

  if(cmd.update) {
    jestOptions.push('--updateSnapshot');
  }

  if(cmd.verbose === undefined || cmd.verbose.toString() === 'true') {
    jestOptions.push('--verbose');
  }

  // Test app using jest
  const jest: SpawnSyncReturns<Buffer> = spawnSync(jestPath, jestOptions, {
    encoding: 'utf-8',
    stdio: 'inherit'
  });

  process.exit(jest.status);
};
