import chalk from 'chalk';
import * as fs from 'fs';
import ora from 'ora';

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
        color = chalk.yellow;
        break;
      default:
        color = chalk.cyan;
        break;
    }

    console.log(color(message));
  }
};

export const createSpinner = (quiet = false): any => {
  if(quiet) {
    return {
      fail: () => {},
      start: () => {},
      succeed: () => {}
    };
  }

  return ora({color: 'yellow'});
};

export const getPackageJson = (packagePath?: string) => {
  const path: string = packagePath || `${process.cwd()}/package.json`;

  // Configure package.json
  const packageData: string = fs.readFileSync(path).toString();
  return JSON.parse(packageData);
};

export const setPackageJson = (json, packagePath?: string) => {
  if(!json) {
    return;
  }

  const path: string = packagePath || `${process.cwd()}/package.json`;

  // Update package.json
  fs.writeFileSync(path, JSON.stringify(json, null, 2));
};
