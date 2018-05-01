#!/usr/bin/env node


import * as program from 'commander';
import {compile, dev, init, test} from './commands';

const packageConfig = require('../package.json');

// Commands
program.command('compile [lexConfigFile]')
  .option('-c, --config [path]', 'Webpack configuration file', '')
  .option('-m, --mode [path]', 'Webpack mode ("production" or "development")', '')
  .action(compile);

program.command('dev [lexConfigFile]')
  .option('-c, --config [path]', 'Webpack configuration file', '')
  .action(dev);

program.command('init <appName> [packageName]')
  .action(init);

program.command('test [lexConfigFile]')
  .option('-c, --config [path]', 'Jest configuration file', '')
  .action(test);

// Initialize
program
  .version(packageConfig.version, '-v, --version')
  .parse(process.argv);
