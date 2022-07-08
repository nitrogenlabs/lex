/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import * as fs from 'fs-extra';

import {copyFileSync, copyFolderRecursiveSync} from '../utils/app';
import {log} from '../utils/log';

export const copy = (from: string, to: string, cmd: any, callback: any = () => ({})): Promise<number> => {
  const {cliName = 'Lex', quiet} = cmd;

  // Display message
  log(`${cliName} copying "${to}"...`, 'info', quiet);

  if(!fs.existsSync(from)) {
    log(`\n${cliName} Error: Path not found, "${from}"...`, 'error', quiet);
    callback(1);
    return Promise.resolve(1);
  }

  if(fs.lstatSync(from).isDirectory()) {
    try {
      // Copy directory
      copyFolderRecursiveSync(from, to);
    } catch(error) {
      log(`\n${cliName} Error: Cannot copy "${from}". ${error.message}`, 'error', quiet);
      callback(1);
      return Promise.resolve(1);
    }
  } else {
    try {
      // Copy file
      copyFileSync(from, to);
    } catch(error) {
      log(`\n${cliName} Error: Cannot copy "${from}" ${error.message}`, 'error', quiet);
      callback(1);
      return Promise.resolve(1);
    }
  }

  callback(0);
  return Promise.resolve(0);
};
