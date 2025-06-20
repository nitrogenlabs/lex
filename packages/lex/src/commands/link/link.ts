/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {LexConfig} from '../../LexConfig.js';
import {checkLinkedModules} from '../../utils/app.js';
import {log} from '../../utils/log.js';

export interface LinkOptions {
  readonly cliName?: string;
  readonly quiet?: boolean;
}

export type LinkCallback = (status: number) => void;

export const linked = async (cmd: LinkOptions, callback: LinkCallback = () => ({})): Promise<number> => {
  const {cliName = 'Lex', quiet} = cmd;

  // Display status
  log(`${cliName} checking for linked modules...`, 'info', quiet);

  // Get custom configuration
  await LexConfig.parseConfig(cmd);

  // Check for linked modules
  checkLinkedModules();
  callback(0);
  return Promise.resolve(0);
}; 