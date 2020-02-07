export const CATEGORY_CONFIG: string = 'Config';
export const CATEGORY_EDITOR: string = 'Editor';
export const CATEGORY_FORMAT: string = 'Format';
export const CATEGORY_OTHER: string = 'Other';
export const CATEGORY_OUTPUT: string = 'Output';

export const categoryOrder: string[] = [
  CATEGORY_OUTPUT,
  CATEGORY_FORMAT,
  CATEGORY_CONFIG,
  CATEGORY_EDITOR,
  CATEGORY_OTHER
];

/**
 * {
 *   [optionName]: {
 *     // The type of the option. For 'choice', see also `choices` below.
 *     // When passing a type other than the ones listed below, the option is
 *     // treated as taking any string as argument, and `--option <${type}>` will
 *     // be displayed in --help.
 *     type: "boolean" | "choice" | "int" | string;
 *
 *     // Default value to be passed to the minimist option `default`.
 *     default?: any;
 *
 *     // Alias name to be passed to the minimist option `alias`.
 *     alias?: string;
 *
 *     // For grouping options by category in --help.
 *     category?: string;
 *
 *     // Description to be displayed in --help. If omitted, the option won't be
 *     // shown at all in --help (but see also `oppositeDescription` below).
 *     description?: string;
 *
 *     // Description for `--no-${name}` to be displayed in --help. If omitted,
 *     // `--no-${name}` won't be shown.
 *     oppositeDescription?: string;
 *
 *     // Indicate if this option is simply passed to the API.
 *     // true: use camelified name as the API option name.
 *     // string: use this value as the API option name.
 *     forwardToApi?: boolean | string;
 *
 *     // Indicate that a CLI flag should be an array when forwarded to the API.
 *     array?: boolean;
 *
 *     // Specify available choices for validation. They will also be displayed
 *     // in --help as <a|b|c>.
 *     // Use an object instead of a string if a choice is deprecated and should
 *     // be treated as `redirect` instead, or if you'd like to add description for
 *     // the choice.
 *     choices?: Array<
 *       | string
 *       | { value: string, description?: string, deprecated?: boolean, redirect?: string }
 *     >;
 *
 *     // If the option has a value that is an exception to the regular value
 *     // constraints, indicate that value here (or use a function for more
 *     // flexibility).
 *     exception?: ((value: any) => boolean);
 *
 *     // Indicate that the option is deprecated. Use a string to add an extra
 *     // message to --help for the option, for example to suggest a replacement
 *     // option.
 *     deprecated?: true | string;
 *   }
 * }
 *
 * Note: The options below are sorted alphabetically.
 */
export const categoryOptions = {
  check: {
    alias: 'c',
    category: CATEGORY_OUTPUT,
    description: 'Check if the given files are formatted, print a human-friendly summary message and paths to unformatted files (see also --list-different).',
    type: 'boolean'
  },
  color: {
    // The supports-color package (a sub sub dependency) looks directly at
    // `process.argv` for `--no-color` and such-like options. The reason it is
    // listed here is to avoid "Ignored unknown option: --no-color" warnings.
    // See https://github.com/chalk/supports-color/#info for more information.
    default: true,
    description: 'Colorize error messages.',
    oppositeDescription: 'Do not colorize error messages.',
    type: 'boolean'
  },
  config: {
    category: CATEGORY_CONFIG,
    description: 'Path to a Starfire configuration file (.starfirerc, package.json, starfire.config.js).',
    exception: (value) => value === false,
    oppositeDescription: 'Do not look for a configuration file.',
    type: 'path'
  },
  'config-precedence': {
    category: CATEGORY_CONFIG,
    choices: [
      {
        description: 'CLI options take precedence over config file',
        value: 'cli-override'
      },
      {
        description: 'Config file take precedence over CLI options',
        value: 'file-override'
      },
      {
        description: 'If a config file is found will evaluate it and ignore other CLI options. If no config file is found CLI options will evaluate as normal.',
        value: 'prefer-file'
      }
    ],
    default: 'cli-override',
    description: 'Define in which order config files and CLI options should be evaluated.',
    type: 'choice'
  },
  'debug-benchmark': {type: 'boolean'},
  'debug-check': {type: 'boolean'},
  'debug-print-doc': {type: 'boolean'},
  editorconfig: {
    category: CATEGORY_CONFIG,
    default: true,
    description: 'Take .editorconfig into account when parsing configuration.',
    oppositeDescription: 'Don\'t take .editorconfig into account when parsing configuration.',
    type: 'boolean'
  },
  'find-config-path': {
    category: CATEGORY_CONFIG,
    description: 'Find and print the path to a configuration file for the given input file.',
    type: 'path'
  },
  'file-info': {
    type: 'path',
    description: 'Extract the following info (as JSON) for a given file path. Reported fields:\n* ignored (boolean) - true if file path is filtered by --ignore-path\n* inferredParser (string | null) - name of parser inferred from file path'
  },
  help: {
    alias: 'h',
    description: 'Show CLI usage, or details about the given flag.\nExample: --help write',
    exception: (value) => value === '',
    type: 'flag'
  },
  'ignore-path': {
    category: CATEGORY_CONFIG,
    default: '.starfireignore',
    description: 'Path to a file with patterns describing files to ignore.',
    type: 'path'
  },
  'list-different': {
    alias: 'l',
    category: CATEGORY_OUTPUT,
    description: 'Print the names of files that are different from Starfire\'s formatting.',
    type: 'boolean'
  },
  loglevel: {
    choices: ['silent', 'error', 'warn', 'log', 'debug'],
    default: 'log',
    description: 'What level of logs to report.',
    type: 'choice'
  },
  stdin: {
    description: 'Force reading input from stdin.',
    type: 'boolean'
  },
  'support-info': {
    description: 'Print support information as JSON.',
    type: 'boolean'
  },
  version: {
    alias: 'v',
    description: 'Print Starfire version.',
    type: 'boolean'
  },
  'with-node-modules': {
    category: CATEGORY_CONFIG,
    description: 'Process files inside \'node_modules\' directory.',
    type: 'boolean'
  },
  write: {
    category: CATEGORY_OUTPUT,
    description: 'Edit files in-place. (Beware!)',
    type: 'boolean'
  }
};

export const usageSummary: string = 'Usage: starfire [options] [file/glob ...]\nBy default, output is written to stdout.\nStdin is read if it is piped to Starfire and no files are given.';
