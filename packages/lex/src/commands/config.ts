/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {writeFileSync} from 'fs';
import startCase from 'lodash/startCase.js';
import {relative as pathRelative} from 'path';

import {LexConfig} from '../LexConfig.js';
import {createSpinner} from '../utils/app.js';
import {log} from '../utils/log.js';

export const config = async (type: string, cmd: any, callback: any = () => ({})): Promise<number> => {
  const {cliName = 'Lex', json, quiet} = cmd;
  const validTypes: string[] = ['app', 'jest', 'webpack'];

  if(!validTypes.includes(type)) {
    log(`\n${cliName} Error: Option for ${type} not found. Configurations only available for app, jest, and webpack.`, 'error', quiet);
    callback(1);
    return Promise.resolve(1);
  }

  // Display status
  log(`${cliName} generating configuration for ${startCase(type)}...`, 'info', quiet);

  // Get custom configuration
  await LexConfig.parseConfig(cmd);

  let configOptions;

  switch(type) {
    case 'app':
      configOptions = LexConfig.config;
      break;
    case 'jest':
      configOptions = import('../../jest.config.lex');
      break;
    case 'webpack':
      configOptions = import('../../webpack.config');
      break;
  }

  // Output config to console
  const jsonOutput: string = JSON.stringify(configOptions, null, 2);

  if(json) {
    // Spinner
    const spinner = createSpinner(quiet);

    // Start spinner
    spinner.start('Creating JSON output...');

    // Save json locally
    writeFileSync(json, jsonOutput);

    // Success spinner
    spinner.succeed(`Successfully saved JSON output to ${pathRelative(process.cwd(), json)}`);
  }

  callback(0);
  return Promise.resolve(0);
};
