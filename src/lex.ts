#!/usr/bin/env node
import * as program from 'commander';

import {add, build, dev, init, test} from './commands';



const packageConfig = require('../package.json');

// Commands
program.command('add <type> [name]')
  .action(add);

program.command('build [lexConfigFile]')
  .option('-c, --config [path]', 'Webpack configuration file', '')
  .option('-m, --mode [path]', 'Webpack mode ("production" or "development")', '')
  .action(build);

program.command('dev [lexConfigFile]')
  .option('-c, --config [path]', 'Webpack configuration file', '')
  .option('-o, --open', 'Automatically open a new browser window', '')
  .action(dev);

program.command('init <appName> [packageName]')
  .action(init);

program.command('test [lexConfigFile]')
  .option('-c, --config [path]', 'Jest configuration file', '')
  .option('-u, --update', 'Update snapshots', '')
  .action(test);

// Initialize
program
  .version(packageConfig.version, '-v, --version')
  .parse(process.argv);
