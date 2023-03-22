/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {LexConfig} from '../LexConfig.js';
import {checkLinkedModules} from '../utils/app.js';
import {log} from '../utils/log.js';

export const linked = (cmd: any, callback: any = () => ({})): Promise<number> => {
  const {cliName = 'Lex', quiet} = cmd;

  // Display status
  log(`${cliName} checking for linked modules...`, 'info', quiet);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  // Check for linked modules
  checkLinkedModules();
  callback(0);
  return Promise.resolve(0);
};
