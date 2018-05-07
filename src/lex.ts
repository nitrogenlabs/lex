#!/usr/bin/env node
import program from 'commander';

import {add, build, compile, dev, init, test, version} from './commands';

const packageConfig = require('../package.json');

// Commands
program.command('add <type> [name]')
  .option('-l, --lexConfig [path]', 'Lex configuration file path (lex.config.js).')
  .option('-t, --typescript', 'Add files for Typescript.')
  .action(add);

program.command('build')
  .option('-b, --babel [path]', 'Babel configuration file path.')
  .option('-c, --config [path]', 'Webpack configuration file path (webpack.config.js).')
  .option('-l, --lexConfig [path]', 'Lex configuration file path (lex.config.js).')
  .option('-m, --mode [path]', 'Webpack mode ("production" or "development").')
  .option('-t, --typescript', 'Transpile as typescript.')
  .action(build);

program.command('compile')
  .option('-b, --babel [path]', 'Babel configuration file path.')
  .option('-c, --config [path]', 'Transpiler configuration file path (.flowconfig or tsconfig.json).')
  .option('-l, --lexConfig [path]', 'Lex configuration file path (lex.config.js).')
  .option('-t, --typescript', 'Transpile as typescript.')
  .action(compile);

program.command('dev')
  .option('-b, --babel [path]', 'Babel configuration file path.')
  .option('-c, --config [path]', 'Webpack configuration file path (webpack.config.js).')
  .option('-l, --lexConfig [path]', 'Lex configuration file path (lex.config.js).')
  .option('-o, --open', 'Automatically open a new browser window.')
  .option('-t, --typescript', 'Transpile as typescript.')
  .action(dev);

program.command('init <appName> [packageName]')
  .option('-t, --typescript', 'Use a Typescript based app.')
  .action(init);

program.command('test')
  .option('-c, --config [path]', 'Jest configuration file path (jest.config.js).')
  .option('-l, --lexConfig [path]', 'Lex configuration file path (lex.config.js).')
  .option('-s, --setup [path]', 'Jest setup file path.')
  .option('-t, --typescript', 'Transpile as typescript.')
  .option('-u, --update', 'Update snapshots.')
  .action(test);

program.command('versions')
  .action(version);

// Initialize
program
  .version(packageConfig.version)
  .parse(process.argv);

