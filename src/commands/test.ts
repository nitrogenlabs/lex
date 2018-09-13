import execa from 'execa';
import * as path from 'path';

import {LexConfig} from '../LexConfig';
import {createSpinner, log, relativeFilePath} from '../utils';

export const test = async (cmd: any, callback: any = process.exit) => {
  const {cliName = 'Lex', config, detectOpenHandles, quiet, removeCache, setup, update, watch} = cmd;

  log(`${cliName} testing...`, 'info', quiet);

  // Spinner
  const spinner = createSpinner(quiet);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  const {useTypescript} = LexConfig.config;

  if(useTypescript) {
    // Make sure tsconfig.json exists
    LexConfig.checkTypescriptConfig();
  }

  // Configure jest
  const nodePath: string = path.resolve(__dirname, '../../node_modules');
  const jestPath: string = relativeFilePath('jest-cli/bin/jest.js', nodePath);
  const jestConfigFile: string = config || path.resolve(__dirname, '../../jest.config.js');
  const jestSetupFile: string = setup || '';
  const jestOptions: string[] = ['--config', jestConfigFile];

  // Clear cache
  if(removeCache) {
    jestOptions.push('--no-cache');
  }

  if(jestSetupFile !== '') {
    const cwd: string = process.cwd();
    jestOptions.push(`--setupTestFrameworkScriptFile=${path.resolve(cwd, jestSetupFile)}`);
  }

  // Detect open handles
  if(detectOpenHandles) {
    jestOptions.push('--detectOpenHandles');
  }

  // Update snapshots
  if(update) {
    jestOptions.push('--updateSnapshot');
  }

  if(watch) {
    jestOptions.push('--watch');
  }

  // Test app using jest
  try {
    const jest = await execa(jestPath, jestOptions, {
      encoding: 'utf-8',
      stdio: 'inherit'
    });

    if(!jest.status) {
      spinner.succeed('Testing completed!');
    } else {
      spinner.fail('Testing failed!');
    }

    // Kill process
    return callback(jest.status);
  } catch(error) {
    // Display error message
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    // Stop spinner
    spinner.fail('Testing failed!');

    // Kill process
    return callback(1);
  }
};
