#!/usr/bin/env node
/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {program} from 'commander';

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
  .option('-c, --config <path>', 'Custom Webpack configuration file path (ie. webpack.config.js).')
  .option('-l, --lexConfig <path>', 'Lex configuration file path (lex.config.js).')
  .option('-m, --mode <type>', 'Webpack mode ("production" or "development"). Default: "development".', /^(development|production)$/i, 'development')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('-r, --remove', 'Removes all files from the output directory before compiling.')
  .option('-s, --static', 'Creates static HTML files when building app.')
  .option('-t, --typescript', 'Transpile as Typescript.')
  .option('-v, --variables <name>', 'Environment variables to set in "process.env". (ie. "{NODE_ENV: \'production\'}").')
  .option('-w, --watch', 'Watch for changes.')
  .option('--bundler <name>', 'Bundler to use ("webpack" or "esbuild"). Default: "webpack".', /^(webpack|esbuild)$/i, 'webpack')
  .option('--sourcePath <path>', 'Source path')
  .option('--outputPath <path>', 'Output path')
  .option('--outputChunkFilename <filename>', 'The output filename for additional chunks.')
  .option('--outputFilename <filename>', 'The output filename of the bundle. Default: "[name].js".')
  .option('--outputJsonpFunction <func>', 'The name of the JSONP function used for chunk loading. Default: "webpackJsonp".')
  .option('--outputLibrary <library>', 'Expose the exports of the entry point as library.')
  .option('--outputLibraryTarget <target>', 'The type for exposing the exports of the entry point as library. Default: "var".')
  .option('--outputPathInfo <hasInfo>', 'The output filename for additional chunks. Default: false')
  .option('--outputPublicPath <path>', 'The public path for the assets. Default: "/"')
  .option('--outputSourceMapFilename <filename>', 'The output filename for the SourceMap. Default: "[name].map"')
  .option('--buildDelimiter <delimiter>', 'Display custom text after build output. Default: "=== Build done ==="')
  .action((cmd) => build(cmd, process.exit).then(() => {}));

program.command('clean')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('-s, --snapshots', 'Remove all "__snapshots__" directories.')
  .action((cmd) => clean(cmd, process.exit).then(() => {}));

program.command('config <type>')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('--json <path>', 'Save output to json file.')
  .action((type, cmd) => config(type, cmd, process.exit).then(() => {}));

program.command('compile')
  .option('-c, --config <path>', 'Transpiler configuration file path (ie. .flowconfig or tsconfig.json).')
  .option('-e, --environment <name>', 'Target environment. "node" or "web". Default: "node".')
  .option('-l, --lexConfig <path>', 'Custom Lex configuration file path (ie. lex.config.js).')
  .option('-r, --remove', 'Removes all files from the output directory before compiling.')
  .option('-t, --typescript', 'Transpile as Typescript.')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('-w, --watch', 'Watches for changes and compiles.')
  .option('--sourcePath <path>', 'Source path')
  .option('--outputPath <path>', 'Output path')
  .action((cmd) => compile(cmd, process.exit).then(() => {}));

program.command('create <type>')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('-t, --typescript', 'Create Typescript version.')
  .option('--outputFile <path>', 'Output filename.')
  .option('--outputName <name>', 'Output name.')
  .action((type, cmd) => create(type, cmd, process.exit).then(() => {}));

program.command('dev')
  .option('-c, --config <path>', 'Custom Webpack configuration file path (ie. webpack.config.js).')
  .option('-l, --lexConfig <path>', 'Custom Lex configuration file path (ie. lex.config.js).')
  .option('-o, --open', 'Automatically open dev server in a new browser window.')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('-r, --remove', 'Removes all files from the output directory before compiling.')
  .option('-t, --typescript', 'Transpile as Typescript.')
  .option('-v, --variables <name>', 'Environment variables to set in "process.env". (ie. "{NODE_ENV: \'development\'}").')
  .option('-w, --watch', 'Watch for changes.')
  .option('--bundleAnalyzer', 'Run bundle analyzer.')
  .option('--sourcePath <path>', 'Source path')
  .option('--outputPath <path>', 'Output path')
  .action((cmd) => dev(cmd, process.exit).then(() => {}));

program.command('init <appName> [packageName]')
  .option('-i, --install', 'Install dependencies.')
  .option('-m, --package-manager <manager>', 'Which package manager to use. Default: npm', /^(npm|yarn)$/i, 'npm')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('-t, --typescript', 'Use a Typescript based app.')
  .action((appName, packageName, cmd) => init(appName, packageName, cmd, process.exit).then(() => {}));

program.command('linked')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .action((cmd) => linked(cmd, process.exit).then(() => {}));

program.command('lint')
  .option('--cache', 'Only check changed files. Default: false.')
  .option('--cache-location <path>', 'Path to the cache file or directory.')
  .option('--color', 'Force enabling of color.')
  .option('--config <path>', 'Use this configuration, overriding .eslintrc.* config options if present.')
  .option('--debug', 'Output debugging information.')
  .option('--env-info', 'Output execution environment information. Default: false.')
  .option('--env <name>', 'Specify environments.')
  .option('--ext <type>', 'Specify JavaScript file extensions. Default: .js.')
  .option('--fix', 'Automatically fix problems.')
  .option('--fix-dry-run', 'Automatically fix problems without saving the changes to the file system.')
  .option('--fix-type <type>', 'Specify the types of fixes to apply (problem, suggestion, layout).')
  .option('--format <name>', 'Use a specific output format. Default: stylish.')
  .option('--global <variables>', 'Define global variables.')
  .option('--ignore-path <path>', 'Specify path of ignore file.')
  .option('--ignore-pattern <pattern>', 'Pattern of files to ignore (in addition to those in .eslintignore).')
  .option('--init', 'Run config initialization wizard. Default: false.')
  .option('--max-warnings <num>', 'Number of warnings to trigger nonzero exit code. Default: -1.')
  .option('--no-color', 'Force disabling of color.')
  .option('--no-eslintrc', 'Disable use of configuration from .eslintrc.*.')
  .option('--no-ignore', 'Disable use of ignore files and patterns.')
  .option('--no-inline-config', 'Prevent comments from changing config or rules.')
  .option('--output-file <path>', 'Specify file to write report to.')
  .option('--parser <name>', 'Specify the parser to be used.')
  .option('--parser-options <options>', 'Specify parser options.')
  .option('--plugin <plugins>', 'Specify plugins.')
  .option('--print-config <path>', 'Print the configuration for the given file.')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('--report-unused-disable-directives', 'Adds reported errors for unused eslint-disable directives.')
  .option('--resolve-plugins-relative-to <path>', 'A folder where plugins should be resolved from.')
  .option('--rule <path>', 'Specify rules.')
  .option('--rulesdir <path>', 'Use additional rules from this directory.')
  .option('--stdin', 'Lint code provided on <STDIN> - Default: false.')
  .option('--stdin-filename <name>', 'Specify filename to process STDIN as.')
  .action((cmd) => lint(cmd, process.exit).then(() => {}));

program.command('migrate')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .action((cmd) => migrate(cmd, process.exit).then(() => {}));

program.command('publish')
  .option('-b, --bump <type>', 'Increments the version. Types include: major, minor, patch, beta, alpha, rc. Default: "patch"., ', /^(major|minor|patch|beta|alpha|rc)$/i, 'patch')
  .option('-o, --otp <code>', 'Provide a two-factor code.')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('-p, --private', 'Publishes the module as restricted.')
  .option('-m, --package-manager <manager>', 'Which package manager to use. Default: npm', /^(npm|yarn)$/i, 'npm')
  .option('-t, --tag <tag>', 'Registers the published package with the given tag.')
  .option('-v, --new-version <versionNumber>', 'Publish as a specific version.')
  .action((cmd) => publish(cmd, process.exit).then(() => {}));

program.command('test')
  .option('-c, --config <path>', 'Custom Jest configuration file path (ie. jest.config.js).')
  .option('-d, --detectOpenHandles', 'Attempt to collect and print open handles preventing Jest from exiting cleanly')
  .option('-e, --environment <name>', 'Target environment. "node" or "web". Default: "node".')
  .option('-l, --lexConfig <path>', 'Custom Lex configuration file path (ie. lex.config.js).')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('-r, --clearCache', 'Clear Jest cache.')
  .option('-s, --setup <path>', 'Jest setup file path.')
  .option('-t, --typescript', 'Transpile as Typescript.')
  .option('-u, --update', 'Update snapshots. Runs "jest --updateSnapshots"')
  .option('-w, --watch <path>', 'Watch files for changes and rerun tests related to changed files.')
  .option('--bail', 'Exit the test suite immediately upon the first failing test suite.')
  .option('--changedFilesWithAncestor', 'Runs tests related to the current changes and the changes made in the last commit.')
  .option('--changedSince', 'Runs tests related the changes since the provided branch.')
  .option('--ci', 'When this option is provided, Jest will assume it is running in a CI environment.')
  .option('--collectCoverageFrom <glob>', 'A glob pattern relative to matching the files that coverage info needs to be collected from.')
  .option('--colors', 'Forces test results output highlighting even if stdout is not a TTY.')
  .option('--debug', 'Print debugging info about your Jest config.')
  .option('--detectOpenHandles', 'Attempt to collect and print open handles preventing Jest from exiting cleanly.')
  .option('--env', 'The test environment used for all tests. This can point to any file or node module. Examples: jsdom, node or path/to/my-environment.js.')
  .option('--errorOnDeprecated', 'Make calling deprecated APIs throw helpful error messages.')
  .option('--expand', 'Use this flag to show full diffs and errors instead of a patch.')
  .option('--forceExit', 'Force Jest to exit after all tests have completed running.')
  .option('--json', 'Prints the test results in JSON.')
  .option('--lastCommit', 'Run all tests affected by file changes in the last commit made.')
  .option('--listTests', 'Lists all tests as JSON that Jest will run given the arguments, and exits.')
  .option('--logHeapUsage', 'Logs the heap usage after every test.')
  .option('--maxWorkers <num>', 'Specifies the maximum number of workers the worker-pool will spawn for running tests. ')
  .option('--noStackTrace', 'Disables stack trace in test results output.')
  .option('--notify', 'Activates notifications for test results.')
  .option('--onlyChanged', 'un based on which files have changed in the current repository. ')
  .option('--outputFile <filename>', 'Write test results to a file when the --json option is also specified.')
  .option('--passWithNoTests', 'Allows the test suite to pass when no files are found.')
  .option('--runInBand', 'Run all tests serially in the current process, rather than creating a worker pool of child processes that run tests.')
  .option('--showConfig', 'Print your Jest config and then exits.')
  .option('--silent', 'Prevent tests from printing messages through the console.')
  .option('--testLocationInResults', 'Adds a location field to test results.')
  .option('--testNamePattern <regex>', 'Run only tests with a name that matches the regex. ')
  .option('--testPathPattern <regex>', 'A regexp pattern string that is matched against all tests paths before executing the test.')
  .option('--useStderr', 'Divert all output to stderr.')
  .option('--verbose', 'Display individual test results with the test suite hierarchy.')
  .option('--watchAll', 'Watch files for changes and rerun all tests when something changes.')
  .action((cmd) => test(cmd, process.exit).then(() => {}));

program.command('update')
  .option('-i, --interactive', 'Choose which packages to update.')
  .option('-m, --package-manager <manager>', 'Which package manager to use. Default: npm', /^(npm|yarn)$/i, 'npm')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .option('--registry', 'Add a custom registry url.')
  .action((cmd) => update(cmd, process.exit).then(() => {}));

program.command('upgrade')
  .option('-m, --package-manager <manager>', 'Which package manager to use. Default: npm', /^(npm|yarn)$/i, 'npm')
  .option('-q, --quiet', 'No Lex notifications printed in the console.')
  .action((cmd) => upgrade(cmd, process.exit).then(() => {}));

program.command('versions')
  .option('-j, --json', 'Print the version as a JSON object.')
  .action((cmd) => versions(cmd, process.exit).then(() => {}));

// Initialize
program
  .version(packageJson.version)
  .parse(process.argv);
