#!/usr/bin/env node
import program from 'commander';

import {add, build, clean, compile, dev, init, publish, test, update, upgrade, versions} from './commands';


const packageConfig = require('../package.json');

// Commands
program.command('add <type> [name]')
  .option('-l, --lexConfig <path>', 'Lex configuration file path (ie. lex.config.js).')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('-t, --typescript', 'Add Typescript based files.')
  .action(add);

program.command('build')
  .option('-b, --babel <path>', 'Babel configuration file path (ie. .babelrc).')
  .option('-c, --config <path>', 'Custom Webpack configuration file path (ie. webpack.config.js).')
  .option('-e, --environment <name>', 'Environment name to set as NODE_ENV. (ie. development).')
  .option('-l, --lexConfig <path>', 'Lex configuration file path (lex.config.js).')
  .option('-m, --mode <type>', 'Webpack mode ("production" or "development").')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('-r, --remove', 'Removes all files from the output directory before compiling.')
  .option('-t, --typescript', 'Transpile as Typescript.')
  .action(build);

program.command('clean')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('-s, --snapshots', 'Remove all "__snapshots__" directories.')
  .action(clean);

program.command('compile')
  .option('-b, --babel <path>', 'Babel configuration file path (ie. .babelrc).')
  .option('-c, --config <path>', 'Transpiler configuration file path (ie. .flowconfig or tsconfig.json).')
  .option('-l, --lexConfig <path>', 'Custom Lex configuration file path (ie. lex.config.js).')
  .option('-r, --remove', 'Removes all files from the output directory before compiling.')
  .option('-t, --typescript', 'Transpile as Typescript.')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('-w, --watch', 'Watches for changes and compiles.')
  .action(compile);

program.command('dev')
  .option('-b, --babel <path>', 'Babel configuration file path (ie. .babelrc).')
  .option('-c, --config <path>', 'Custom Webpack configuration file path (ie. webpack.config.js).')
  .option('-e, --environment <name>', 'Environment name to set as NODE_ENV. (ie. development).')
  .option('-l, --lexConfig <path>', 'Custom Lex configuration file path (ie. lex.config.js).')
  .option('-o, --open', 'Automatically open dev server in a new browser window.')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('-r, --remove', 'Removes all files from the output directory before compiling.')
  .option('-t, --typescript', 'Transpile as Typescript.')
  .action(dev);

program.command('init <appName> [packageName]')
  .option('-i, --install', 'Install dependencies.')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('-t, --typescript', 'Use a Typescript based app.')
  .action(init);

program.command('publish')
  .option('-b, --bump <type>', 'Increments the version. Types include: major, minor, patch, beta, alpha, rc')
  .option('-p, --private', 'Publishes the module as restricted.')
  .option('-o --otp <code>', 'Provide a two-factor code.')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('-t --tag <tag>', 'Registers the published package with the given tag.')
  .option('-v, --new-version <versionNumber>', 'Publish as a specific version.')
  .action(publish);

program.command('test')
  .option('-c, --config <path>', 'Custom Jest configuration file path (ie. jest.config.js).')
  .option('-l, --lexConfig <path>', 'Custom Lex configuration file path (ie. lex.config.js).')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('-s, --setup <path>', 'Jest setup file path.')
  .option('-t, --typescript', 'Transpile as Typescript.')
  .option('-u, --update', 'Update snapshots. Runs "jest --updateSnapshots"')
  .option('-w, --watch', 'Watches for changes and tests.')
  .option('-v, --verbose [value]', 'Print the version and exit.')
  .action(test);

program.command('update')
  .option('-i, --interactive', 'Choose which packages to update.')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .action(update);

program.command('upgrade')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .action(upgrade);

program.command('versions')
  .option('-j, --json', 'Print the version as a JSON object.')
  .action(versions);

// Initialize
program
  .version(packageConfig.version)
  .parse(process.argv);
