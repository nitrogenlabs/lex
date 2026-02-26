/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {existsSync, lstatSync} from 'fs';

import {copyFileSync, copyFolderRecursiveSync} from '../../utils/app.js';
import {log} from '../../utils/log.js';

export interface CopyOptions {
  readonly cliName?: string;
  readonly quiet?: boolean;
}

export type CopyCallback = (status: number) => void;

export const copy = (
  from: string,
  to: string,
  cmd: CopyOptions,
  callback: CopyCallback = () => ({})
): Promise<number> => {
  const {cliName = 'Lex', quiet} = cmd;

  // Display message
  log(`${cliName} copying "${to}"...`, 'info', quiet);

  if(!existsSync(from)) {
    log(`\n${cliName} Error: Path not found, "${from}"...`, 'error', quiet);
    callback(1);
    return Promise.resolve(1);
  }

  if(lstatSync(from).isDirectory()) {
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