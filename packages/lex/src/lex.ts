#!/usr/bin/env node
/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {Option, program} from 'commander';

import packageJson from '../package.json' assert {type: 'json'};
import {build} from './commands/build.js';
import {clean} from './commands/clean.js';
import {compile} from './commands/compile.js';
import {config} from './commands/config.js';
import {create} from './commands/create.js';
import {dev} from './commands/dev.js';
import {init} from './commands/init.js';
import {linked} from './commands/link.js';
import {lint} from './commands/lint.js';
import {migrate} from './commands/migrate.js';
import {publish} from './commands/publish.js';
import {test} from './commands/test.js';
import {update} from './commands/update.js';
import {upgrade} from './commands/upgrade.js';
import {versions} from './commands/versions.js';

// Commands
program.command('build')
  .option('--analyze', 'It invokes webpack-bundle-analyzer plugin to get bundle information.', false)
  .addOption(new Option('--bundler <name>', 'Bundler to use ("webpack" or "esbuild"). Default: "webpack".').choices(['webpack', 'esbuild']).default('webpack'))
  .option('--config <path>', 'Custom Webpack configuration file path (ie. webpack.config.js).')
  .option('--config-name <value...>', 'Name of the configuration to use.')
  .option('--define-process-env-node-env <value>', 'Sets process.env.NODE_ENV to the specified value. (Currently an alias for `--node-env`)')
  .option('--devtool <value>', 'A developer tool to enhance debugging (false | eval | [inline-|hidden-|eval-][nosources-][cheap-[module-]]source-map).')
  .option('--disable-interpret', 'Disable interpret for loading the config file.', false)
  .option('--entry <value...>', 'A module that is loaded upon startup. Only the last one is exported.')
  .option('--env <value>', 'Environment passed to the configuration when it is a function.')
  .option('--fail-on-warnings', 'Stop webpack-cli process with non-zero exit code on warnings from webpack', false)
  .option('--json <value>', 'Prints result as JSON or store it in a file.')
  .option('--lexConfig <path>', 'Lex configuration file path (lex.config.js).')
  .option('--merge', 'Merge two or more configurations using "webpack-merge".', false)
  .addOption(new Option('--mode <type>', 'Webpack mode ("production" or "development"). Default: "development".').choices(['development', 'production']).default('development'))
  .option('--name <value>', 'Name of the configuration. Used when loading multiple configurations.')
  .option('--no-devtool', 'Negative "devtool" option.', false)
  .option('--no-stats', 'Negative "stats" option.', false)
  .option('--no-target', 'Negative "target" option.', false)
  .option('--no-watch', 'Negative "watch" option.', false)
  .option('--no-watch-options-stdin', 'Negative "watch-options-stdin" option.', false)
  .option('--node-env <value>', 'Sets process.env.NODE_ENV to the specified value.')
  .option('--output-path <value>', 'The output directory as **absolute path** (required).')
  .option('--quiet', 'No Lex notifications printed in the console.', false)
  .option('--remove', 'Removes all files from the output directory before compiling.', false)
  .option('--sourcePath <path>', 'Source path')
  .option('--stats <value>', 'Stats options object or preset name.')
  .option('--static', 'Creates static HTML files when building app.', false)
  .option('--target <value>', 'Environment to build for. Environment to build for. An array of environments to build for all of them when possible.')
  .option('--typescript', 'Transpile as Typescript.', false)
  .option('--variables <name>', 'Environment variables to set in "process.env". (ie. "{NODE_ENV: \'production\'}").')
  .option('--watch', 'Watch for changes.', false)
  .option('--watch-options-stdin', 'Stop watching when stdin stream has ended.', false)
  .action((cmd) => build(cmd, process.exit).then(() => {}));

program.command('clean')
  .option('--quiet', 'No Lex notifications printed in the console.')
  .option('--snapshots', 'Remove all "__snapshots__" directories.')
  .action((cmd) => clean(cmd, process.exit).then(() => {}));

program.command('config <type>')
  .option('--quiet', 'No Lex notifications printed in the console.')
  .option('--json <path>', 'Save output to json file.')
  .action((type, cmd) => config(type, cmd, process.exit).then(() => {}));

program.command('compile')
  .option('--config <path>', 'Transpiler configuration file path (ie. tsconfig.json).')
  .option('--environment <name>', 'Target environment. "node" or "web". Default: "node".')
  .option('--lexConfig <path>', 'Custom Lex configuration file path (ie. lex.config.js).')
  .option('--outputPath <path>', 'Output path')
  .option('--remove', 'Removes all files from the output directory before compiling.')
  .option('--sourcePath <path>', 'Source path')
  .option('--typescript', 'Transpile as Typescript.')
  .option('--quiet', 'No Lex notifications printed in the console.')
  .option('--watch', 'Watches for changes and compiles.')
  .action((cmd) => compile(cmd, process.exit).then(() => {}));

program.command('create <type>')
  .option('--outputFile <path>', 'Output filename.')
  .option('--outputName <name>', 'Output name.')
  .option('--quiet', 'No Lex notifications printed in the console.')
  .option('--typescript', 'Create Typescript version.')
  .action((type, cmd) => create(type, cmd, process.exit).then(() => {}));

program.command('dev')
  .option('--bundleAnalyzer', 'Run bundle analyzer.')
  .option('--config <path>', 'Custom Webpack configuration file path (ie. webpack.config.js).')
  .option('--lexConfig <path>', 'Custom Lex configuration file path (ie. lex.config.js).')
  .option('--open', 'Automatically open dev server in a new browser window.')
  .option('--outputPath <path>', 'Output path')
  .option('--quiet', 'No Lex notifications printed in the console.')
  .option('--remove', 'Removes all files from the output directory before compiling.')
  .option('--sourcePath <path>', 'Source path')
  .option('--typescript', 'Transpile as Typescript.')
  .option('--variables <name>', 'Environment variables to set in "process.env". (ie. "{NODE_ENV: \'development\'}").')
  .option('--watch', 'Watch for changes.')
  .action((cmd) => dev(cmd, process.exit).then(() => {}));

program.command('init <appName> [packageName]')
  .option('--install', 'Install dependencies.')
  .addOption(new Option('--package-manager <manager>', 'Which package manager to use. Default: npm').choices(['npm', 'yarn']).default('npm'))
  .option('--quiet', 'No Lex notifications printed in the console.')
  .option('--typescript', 'Use a Typescript based app.')
  .action((appName, packageName, cmd) => init(appName, packageName, cmd, process.exit).then(() => {}));

program.command('linked')
  .option('--quiet', 'No Lex notifications printed in the console.')
  .action((cmd) => linked(cmd, process.exit).then(() => {}));

program.command('lint')
  .option('--cache', 'Only check changed files. Default: false.', false)
  .option('--cache-location <path>', 'Path to the cache file or directory.')
  .option('--color', 'Force enabling of color.', false)
  .option('--config <path>', 'Use this configuration, overriding .eslintrc.* config options if present.')
  .option('--debug', 'Output debugging information.', false)
  .option('--env-info', 'Output execution environment information. Default: false.', false)
  .option('--env <name>', 'Specify environments.')
  .option('--ext <type>', 'Specify JavaScript file extensions. Default: .js.')
  .option('--fix', 'Automatically fix problems.', false)
  .option('--fix-dry-run', 'Automatically fix problems without saving the changes to the file system.', false)
  .option('--fix-type <type>', 'Specify the types of fixes to apply (problem, suggestion, layout).')
  .option('--format <name>', 'Use a specific output format. Default: stylish.')
  .option('--global <variables>', 'Define global variables.')
  .option('--ignore-path <path>', 'Specify path of ignore file.')
  .option('--ignore-pattern <pattern>', 'Pattern of files to ignore (in addition to those in .eslintignore).')
  .option('--init', 'Run config initialization wizard. Default: false.', false)
  .option('--max-warnings <num>', 'Number of warnings to trigger nonzero exit code. Default: -1.')
  .option('--no-color', 'Force disabling of color.', false)
  .option('--no-eslintrc', 'Disable use of configuration from .eslintrc.*.', false)
  .option('--no-ignore', 'Disable use of ignore files and patterns.', false)
  .option('--no-inline-config', 'Prevent comments from changing config or rules.', false)
  .option('--output-file <path>', 'Specify file to write report to.')
  .option('--parser <name>', 'Specify the parser to be used.')
  .option('--parser-options <options>', 'Specify parser options.')
  .option('--plugin <plugins>', 'Specify plugins.')
  .option('--print-config <path>', 'Print the configuration for the given file.')
  .option('--quiet', 'No Lex notifications printed in the console.', false)
  .option('--report-unused-disable-directives', 'Adds reported errors for unused eslint-disable directives.', false)
  .option('--resolve-plugins-relative-to <path>', 'A folder where plugins should be resolved from.')
  .option('--rule <path>', 'Specify rules.')
  .option('--rulesdir <path>', 'Use additional rules from this directory.')
  .option('--stdin', 'Lint code provided on <STDIN> - Default: false.', false)
  .option('--stdin-filename <name>', 'Specify filename to process STDIN as.')
  .action((cmd) => lint(cmd, process.exit).then(() => {}));

program.command('migrate')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .action((cmd) => migrate(cmd, process.exit).then(() => {}));

program.command('publish')
  .addOption(new Option('--bump <type>', 'Increments the version. Types include: major, minor, patch, beta, alpha, rc. Default: "patch".').choices(['major', 'minor', 'patch', 'beta', 'alpha', 'rc']).default('patch'))
  .option('--new-version <versionNumber>', 'Publish as a specific version.')
  .option('--otp <code>', 'Provide a two-factor code.')
  .addOption(new Option('--package-manager <manager>', 'Which package manager to use. Default: npm').choices(['npm', 'yarn']).default('npm'))
  .option('--private', 'Publishes the module as restricted.')
  .option('--quiet', 'No Lex notifications printed in the console.')
  .option('--tag <tag>', 'Registers the published package with the given tag.')
  .action((cmd) => publish(cmd, process.exit).then(() => {}));

program.command('test')
  .option('--bail', 'Exit the test suite immediately upon the first failing test suite.')
  .option('--changedFilesWithAncestor', 'Runs tests related to the current changes and the changes made in the last commit.')
  .option('--changedSince', 'Runs tests related the changes since the provided branch.')
  .option('--ci', 'When this option is provided, Jest will assume it is running in a CI environment.')
  .option('--clearCache', 'Clear Jest cache.')
  .option('--collectCoverageFrom <glob>', 'A glob pattern relative to matching the files that coverage info needs to be collected from.')
  .option('--colors', 'Forces test results output highlighting even if stdout is not a TTY.')
  .option('--config <path>', 'Custom Jest configuration file path (ie. jest.config.js).')
  .option('--debug', 'Print debugging info about your Jest config.')
  .option('--detectOpenHandles', 'Attempt to collect and print open handles preventing Jest from exiting cleanly')
  .option('--environment <name>', 'Target environment. "node" or "web". Default: "node".')
  .option('--env', 'The test environment used for all tests. This can point to any file or node module. Examples: jsdom, node or path/to/my-environment.js.')
  .option('--errorOnDeprecated', 'Make calling deprecated APIs throw helpful error messages.')
  .option('--expand', 'Use this flag to show full diffs and errors instead of a patch.')
  .option('--forceExit', 'Force Jest to exit after all tests have completed running.')
  .option('--json', 'Prints the test results in JSON.')
  .option('--lastCommit', 'Run all tests affected by file changes in the last commit made.')
  .option('--lexConfig <path>', 'Custom Lex configuration file path (ie. lex.config.js).')
  .option('--listTests', 'Lists all tests as JSON that Jest will run given the arguments, and exits.')
  .option('--logHeapUsage', 'Logs the heap usage after every test.')
  .option('--maxWorkers <num>', 'Specifies the maximum number of workers the worker-pool will spawn for running tests. ')
  .option('--noStackTrace', 'Disables stack trace in test results output.')
  .option('--notify', 'Activates notifications for test results.')
  .option('--onlyChanged', 'un based on which files have changed in the current repository. ')
  .option('--outputFile <filename>', 'Write test results to a file when the --json option is also specified.')
  .option('--passWithNoTests', 'Allows the test suite to pass when no files are found.')
  .option('--quiet', 'No Lex notifications printed in the console.')
  .option('--runInBand', 'Run all tests serially in the current process, rather than creating a worker pool of child processes that run tests.')
  .option('--setup <path>', 'Jest setup file path.')
  .option('--showConfig', 'Print your Jest config and then exits.')
  .option('--silent', 'Prevent tests from printing messages through the console.')
  .option('--testLocationInResults', 'Adds a location field to test results.')
  .option('--testNamePattern <regex>', 'Run only tests with a name that matches the regex. ')
  .option('--testPathPattern <regex>', 'A regexp pattern string that is matched against all tests paths before executing the test.')
  .option('--typescript', 'Transpile as Typescript.')
  .option('--update', 'Update snapshots. Runs "jest --updateSnapshots"')
  .option('--useStderr', 'Divert all output to stderr.')
  .option('--verbose', 'Display individual test results with the test suite hierarchy.')
  .option('--watch <path>', 'Watch files for changes and rerun tests related to changed files.')
  .option('--watchAll', 'Watch files for changes and rerun all tests when something changes.')
  .action((cmd) => test(cmd, process.exit).then(() => {}));

program.command('update')
  .option('--interactive', 'Choose which packages to update.')
  .addOption(new Option('--package-manager <manager>', 'Which package manager to use. Default: npm').choices(['npm', 'yarn']).default('npm'))
  .option('--quiet', 'No Lex notifications printed in the console.')
  .option('--registry', 'Add a custom registry url.')
  .action((cmd) => update(cmd, process.exit).then(() => {}));

program.command('upgrade')
  .addOption(new Option('--package-manager <manager>', 'Which package manager to use. Default: npm').choices(['npm', 'yarn']).default('npm'))
  .option('--quiet', 'No Lex notifications printed in the console.')
  .action((cmd) => upgrade(cmd, process.exit).then(() => {}));

program.command('versions')
  .option('--json', 'Print the version as a JSON object.')
  .action((cmd) => versions(cmd, process.exit).then(() => {}));

// Initialize
program
  .version(packageJson.version)
  .parse(process.argv);
