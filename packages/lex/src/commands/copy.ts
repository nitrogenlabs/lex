/**
 * Copyright (c) 2018, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import fs from 'fs';

import {copyFileSync, copyFolderRecursiveSync, log} from '../utils';

export const copy = (from: string, to: string, cmd: any, callback: any = process.exit) => {
  const {cliName = 'Lex', quiet} = cmd;

  // Display message
  log(`${cliName} copying "${to}"...`, 'info', quiet);

  if(!fs.existsSync(from)) {
    log(`\n${cliName} Error: Path not found, "${from}"...`, 'error', quiet);
    return callback(1);
  }

  if(fs.lstatSync(from).isDirectory()) {
    try {
      // Copy directory
      copyFolderRecursiveSync(from, to);
    } catch(error) {
      log(`\n${cliName} Error: Cannot copy "${from}". ${error.message}`, 'error', quiet);
      return callback(1);
    }
  } else {
    try {
      // Copy file
      copyFileSync(from, to);
    } catch(error) {
      log(`\n${cliName} Error: Cannot copy "${from}" ${error.message}`, 'error', quiet);
      return callback(1);
    }
  }

  return callback(0);
};
