#!/usr/bin/env node
import * as program from 'commander';

import {add, build, compile, dev, init, test, version} from './commands';

const packageConfig = require('../package.json');

// Commands
program.command('add <type> [name]')
  .action(add);

program.command('build [lexConfigFile]')
  .option('-c, --config [path]', 'Webpack configuration file path (webpack.config.js)', '')
  .option('-m, --mode [path]', 'Webpack mode ("production" or "development")', '')
  .action(build);

program.command('compile [lexConfigFile]')
  .option('-c, --config [path]', 'Typescript configuration file path (tsconfig.json)', '')
  .action(compile);

program.command('dev [lexConfigFile]')
  .option('-c, --config [path]', 'Webpack configuration file path (webpack.config.js)', '')
  .option('-o, --open', 'Automatically open a new browser window', '')
  .action(dev);

program.command('init <appName> [packageName]')
  .action(init);

program.command('test [lexConfigFile]')
  .option('-c, --config [path]', 'Jest configuration file path (jest.config.js)', '')
  .option('-u, --update', 'Update snapshots', '')
  .action(test);

program.command('versions')
  .action(version);

// Initialize
program
  .version(packageConfig.version)
  .parse(process.argv);

