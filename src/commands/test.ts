import chalk from 'chalk';
import {spawnSync} from 'child_process';
import * as path from 'path';
import {LexConfig} from '../LexConfig';

export const test = (lexConfigFile: string, cmd) => {
  console.log(chalk.blue('Lex testing...'));

  // Get custom configuration
  const configPath: string = lexConfigFile || './lex.config.js';
  LexConfig.parseConfig(configPath);

  // Configure jest
  const jestPath: string = path.resolve(__dirname, '../../node_modules/jest/bin/jest.js');
  const jestSetupFile: string = cmd.config || '';
  const jestOptions: string[] = ['--config', path.resolve(__dirname, '../../jest.config.js')];

  if(jestSetupFile !== '') {
    jestOptions.push('--setupTestFrameworkScriptFile', jestSetupFile);
  }

  // Test app using jest
  const jest = spawnSync(jestPath, jestOptions, {
    encoding: 'utf-8',
    stdio: 'inherit'
  });

  process.exit(jest.status);
};
