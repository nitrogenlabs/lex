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
  .option('-l, --lexConfig <path>', 'Lex configuration file path (lex.config.js).')
  .option('-m, --mode <type>', 'Webpack mode ("production" or "development"). Default: "development".', /^(development|production)$/i, 'development')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('-r, --remove', 'Removes all files from the output directory before compiling.')
  .option('-s, --static', 'Creates static HTML files when building app.')
  .option('-t, --typescript', 'Transpile as Typescript.')
  .option('-v, --variables <name>', 'Environment variables to set in "process.env". (ie. "{NODE_ENV: \'production\'}").')
  .option('--babelPlugins <list>', 'Add Babel plugins (ie. transform-runtime,transform-es2015-modules-amd).')
  .option('--babelPresets <list>', 'Add Babel presets (ie. es2015,react).')
  .action(build);

program.command('clean')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('-s, --snapshots', 'Remove all "__snapshots__" directories.')
  .action(clean);

program.command('compile')
  .option('-b, --babel <path>', 'Babel configuration file path (ie. .babelrc).')
  .option('-c, --config <path>', 'Transpiler configuration file path (ie. .flowconfig or tsconfig.json).')
  .option('-e, --environment <name>', 'Target environment. "node" or "web". Default: "node".')
  .option('-l, --lexConfig <path>', 'Custom Lex configuration file path (ie. lex.config.js).')
  .option('-r, --remove', 'Removes all files from the output directory before compiling.')
  .option('-t, --typescript', 'Transpile as Typescript.')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('-w, --watch', 'Watches for changes and compiles.')
  .option('--babelPlugins <list>', 'Add Babel plugins (ie. transform-runtime,transform-es2015-modules-amd).')
  .option('--babelPresets <list>', 'Add Babel presets (ie. es2015,react).')
  .action(compile);

program.command('dev')
  .option('-b, --babel <path>', 'Babel configuration file path (ie. .babelrc).')
  .option('-c, --config <path>', 'Custom Webpack configuration file path (ie. webpack.config.js).')
  .option('-l, --lexConfig <path>', 'Custom Lex configuration file path (ie. lex.config.js).')
  .option('-o, --open', 'Automatically open dev server in a new browser window.')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('-r, --remove', 'Removes all files from the output directory before compiling.')
  .option('-t, --typescript', 'Transpile as Typescript.')
  .option('-v, --variables <name>', 'Environment variables to set in "process.env". (ie. "{NODE_ENV: \'development\'}").')
  .option('--babelPlugins <list>', 'Add Babel plugins (ie. transform-runtime,transform-es2015-modules-amd).')
  .option('--babelPresets <list>', 'Add Babel presets (ie. es2015,react).')
  .action(dev);

program.command('init <appName> [packageName]')
  .option('-i, --install', 'Install dependencies.')
  .option('-m, --package-manager <manager>', 'Which package manager to use. Default: yarn', /^(npm|yarn)$/i, 'yarn')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('-t, --typescript', 'Use a Typescript based app.')
  .action(init);

program.command('publish')
  .option('-b, --bump <type>', 'Increments the version. Types include: major, minor, patch, beta, alpha, rc. Default: "patch"., ', /^(major|minor|patch|beta|alpha|rc)$/i, 'patch')
  .option('-o, --otp <code>', 'Provide a two-factor code.')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('-p, --private', 'Publishes the module as restricted.')
  .option('-m, --package-manager <manager>', 'Which package manager to use. Default: yarn', /^(npm|yarn)$/i, 'yarn')
  .option('-t, --tag <tag>', 'Registers the published package with the given tag.')
  .option('-v, --new-version <versionNumber>', 'Publish as a specific version.')
  .action(publish);

program.command('test')
  .option('-c, --config <path>', 'Custom Jest configuration file path (ie. jest.config.js).')
  .option('-d, --detectOpenHandles', 'Attempt to collect and print open handles preventing Jest from exiting cleanly')
  .option('-e, --environment <name>', 'Target environment. "node" or "web". Default: "node".')
  .option('-l, --lexConfig <path>', 'Custom Lex configuration file path (ie. lex.config.js).')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('-r, --removeCache', 'Clear Jest cache.')
  .option('-s, --setup <path>', 'Jest setup file path.')
  .option('-t, --typescript', 'Transpile as Typescript.')
  .option('-u, --update', 'Update snapshots. Runs "jest --updateSnapshots"')
  .option('-w, --watch', 'Watches for changes and tests.')
  .action(test);

program.command('update')
  .option('-i, --interactive', 'Choose which packages to update.')
  .option('-m, --package-manager <manager>', 'Which package manager to use. Default: yarn', /^(npm|yarn)$/i, 'yarn')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .action(update);

program.command('upgrade')
  .option('-m, --package-manager <manager>', 'Which package manager to use. Default: yarn', /^(npm|yarn)$/i, 'yarn')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .action(upgrade);

program.command('versions')
  .option('-j, --json', 'Print the version as a JSON object.')
  .action(versions);

// Initialize
program
  .version(packageConfig.version)
  .parse(process.argv);
