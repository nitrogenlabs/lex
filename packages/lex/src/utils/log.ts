/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import chalk from 'chalk';

export const log = (message: string, type: string = 'info', quiet = false) => {
  if(!quiet) {
    let color;

    switch(type) {
      case 'error':
        color = chalk.red;
        break;
      case 'note':
        color = chalk.grey;
        break;
      case 'success':
        color = chalk.greenBright;
        break;
      case 'warn':
      case 'warning':
        color = chalk.yellow;
        break;
      default:
        color = chalk.cyan;
        break;
    }

    // eslint-disable-next-line no-console
    console.log(color(message));
  }
};