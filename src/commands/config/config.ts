/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {writeFileSync} from 'fs';
import {relative as pathRelative} from 'path';
import startCase from 'lodash/startCase.js';
import {LexConfig} from '../../LexConfig.js';
import {createSpinner} from '../../utils/app.js';
import {log} from '../../utils/log.js';

export interface ConfigOptions {
  readonly cliName?: string;
  readonly json?: string;
  readonly quiet?: boolean;
}

export type ConfigCallback = (status: number) => void;

export const config = async (
  type: string,
  cmd: ConfigOptions,
  callback: ConfigCallback = () => ({})
): Promise<number> => {
  const {cliName = 'Lex', json, quiet} = cmd;
  const validTypes: string[] = ['app', 'jest', 'webpack'];

  if(!validTypes.includes(type)) {
    log(`\n${cliName} Error: Option for ${type} not found. Configurations only available for app, jest, and webpack.`, 'error', quiet);
    callback(1);
    return Promise.resolve(1);
  }

  log(`${cliName} generating configuration for ${startCase(type)}...`, 'info', quiet);

  await LexConfig.parseConfig(cmd);

  let configOptions;

  switch(type) {
    case 'app':
      configOptions = LexConfig.config;
      break;
    case 'jest':
      configOptions = import('../../../jest.config.mjs');
      break;
    case 'webpack':
      configOptions = import('../../../webpack.config.js');
      break;
  }

  const jsonOutput: string = JSON.stringify(configOptions, null, 2);

  if(json) {
    const spinner = createSpinner(quiet);

    spinner.start('Creating JSON output...');

    writeFileSync(json, jsonOutput);

    spinner.succeed(`Successfully saved JSON output to ${pathRelative(process.cwd(), json)}`);
  }

  callback(0);
  return Promise.resolve(0);
};