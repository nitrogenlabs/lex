import chalk from 'chalk';
import {spawnSync} from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import {LexConfig} from '../LexConfig';

export const test = (lexConfigFile: string, cmd) => {
  const cwd: string = process.cwd();
  console.log(chalk.cyan('Lex testing...'));

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  if(LexConfig.config.useTypescript) {
    // Make sure tsconfig.json exists
    const tsconfigPath: string = path.resolve(cwd, './tsconfig.json');

    if(!fs.existsSync(tsconfigPath)) {
      fs.writeFileSync(tsconfigPath, fs.readFileSync(path.resolve(__dirname, '../../tsconfig.json')));
    }
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

  // Test app using jest
  const jest = spawnSync(jestPath, jestOptions, {
    encoding: 'utf-8',
    stdio: 'inherit'
  });

  process.exit(jest.status);
};
