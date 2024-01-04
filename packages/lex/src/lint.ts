#!/usr/bin/env node
/**
 * Copyright (c) 2023-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {program} from 'commander';

import packageJson from '../package.json' assert {type: 'json'};
import {lint} from './commands/lint.js';

program
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

program
  .version(packageJson.version)
  .parse(process.argv);
