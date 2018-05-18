import chalk from 'chalk';

// import {spawnSync} from 'child_process';
// import {LexConfig} from '../LexConfig';

const packageConfig = require('../../package.json');
const parseVersion = (packageVersion: string): string => {
  return packageVersion.replace(/\^/g, '');
};

export const version = () => {
  console.log(chalk.bgCyan('Versions:'));
  console.log(chalk.cyan(`  Lex: ${packageConfig.version}`));
  console.log(chalk.grey(`  ----------`));
  console.log(chalk.cyan(`  Babel: ${parseVersion(packageConfig.dependencies['@babel/core'])}`));
  console.log(chalk.cyan(`  Jest: ${parseVersion(packageConfig.dependencies.jest)}`));
  console.log(chalk.cyan(`  Typescript: ${parseVersion(packageConfig.dependencies.typescript)}`));
  console.log(chalk.cyan(`  Webpack: ${parseVersion(packageConfig.dependencies.webpack)}`));
};
