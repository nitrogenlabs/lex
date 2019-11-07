#!/usr/bin/env node
import program from 'commander';

import {format, lint, versions} from './commands';

const packageConfig = require('../package.json');

program.command('format')
  .option('-s, --starfireConfig [path]', 'Starfire configuration file path (starfire.config.js).')
  .action(format);

program.command('lint')
  .option('-c, --config [path]', 'ESLint configuration file path (.eslintrc)')
  .option('-f, --fix', 'Automatically fix problems.')
  .option('-r, --reactNative', 'Lint as React Native.')
  .option('-s, --starfireConfig [path]', 'Starfire configuration file path (starfire.config.js).')
  .option('-t, --typescript', 'Lint as typescript.')
  .action(lint);

// Included module versions
program.command('versions')
  .action(versions);

// Initialize
program
  .version(packageConfig.version)
  .parse(process.argv);
