import * as camelCase from 'camelcase';
import chalk from 'chalk';
import * as dashify from 'dashify';
import * as fs from 'fs';
import * as globby from 'globby';
import ignore from 'ignore';
import * as leven from 'leven';
import {flatten, groupBy, pick} from 'lodash';
import path from 'path';
import readline from 'readline';

import {CleanAst} from '../common/CleanAst';
import {ConfigError} from '../common/errors/ConfigError';
import {DebugError} from '../common/errors/DebugError';
import {Support} from '../common/Support';
import {ThirdParty} from '../common/ThirdParty';
import {Util} from '../common/Util';
import {ResolveConfig} from '../config/ResolveConfig';
import {Options} from '../main/Options';
import {OptionsNormalizer} from '../main/OptionsNormalizer';
import {Starfire} from '../StarFire/Starfire';
import {CLIConstants} from './CLIConstants';

export interface LogFunctionType {
  debug: (type: string, color: string) => void;
  error: (type: string, color: string) => void;
  log: (type: string, color: string) => void;
  warn: (type: string, color: string) => void;
}

export interface CLIContextType {
  args?: any;
  argv?: any;
  logger?: any;
}

export class CliUtils {
  static OPTION_USAGE_THRESHOLD: number = 25;
  static CHOICE_USAGE_MARGIN: number = 3;
  static CHOICE_USAGE_INDENTATION: number = 2;

  static getOptions(argv, detailedOptions): any {
    return detailedOptions.filter((option) => option.forwardToApi).reduce(
      (current, option) => ({...current, [option.forwardToApi]: argv[option.name]}),
      {}
    );
  }

  static cliifyOptions(object, apiDetailedOptionMap): any {
    return Object.keys(object || {}).reduce((output, key) => {
      const apiOption = apiDetailedOptionMap[key];
      const cliKey = apiOption ? apiOption.name : key;

      output[dashify(cliKey)] = object[key];
      return output;
    }, {});
  }

  static diff(a, b): any {
    return require('diff').createTwoFilesPatch('', '', a, b, '', '', {context: 2});
  }

  static handleError(context, filename, error): any {
    const isParseError = Boolean(error && error.loc);
    const isValidationError = /Validation Error/.test(error && error.message);

    // For parse errors and validation errors, we only want to show the error
    // message formatted in a nice way. `String(error)` takes care of that. Other
    // (unexpected) errors are passed as-is as a separate argument to
    // `console.error`. That includes the stack trace (if any), and shows a nice
    // `Util.inspect` of throws things that aren't `Error` objects. (The Flow
    // parser has mistakenly thrown arrays sometimes.)
    if(isParseError) {
      context.logger.error(`${filename}: ${String(error)}`);
    } else if(isValidationError || error instanceof ConfigError) {
      context.logger.error(String(error));
      // If validation fails for one file, it will fail for all of them.
      process.exit(1);
    } else if(error instanceof DebugError) {
      context.logger.error(`${filename}: ${error.message}`);
    } else {
      context.logger.error(`${filename}: ${error.stack || error}`);
    }

    // Don't exit the process if one file failed
    process.exitCode = 2;
  }

  static logResolvedConfigPathOrDie(context, filePath): void {
    const configFile = ResolveConfig.resolveConfigFileSync(filePath);

    if(configFile) {
      context.logger.log(path.relative(process.cwd(), configFile));
    } else {
      process.exit(1);
    }
  }

  static writeOutput(result, options): void {
    // Don't use `console.log` here since it adds an extra newline at the end.
    process.stdout.write(result.formatted);

    if(options.cursorOffset >= 0) {
      process.stderr.write(`${result.cursorOffset}\n`);
    }
  }

  static listDifferent(context, input, options, filePath: string): boolean {
    if(!context.argv['list-different']) {
      return null;
    }

    options = {...options, filePath};

    if(!Starfire.check(input, options)) {
      if(!context.argv.write) {
        context.logger.log(filePath);
      }

      process.exitCode = 1;
    }

    return true;
  }

  static format(context, input, opt): any {
    if(context.argv['debug-print-doc']) {
      const doc = Starfire.debug.printToDoc(input, opt);
      return {formatted: Starfire.debug.formatDoc(doc)};
    }

    if(context.argv['debug-check']) {
      const pp = Starfire.format(input, opt);
      const pppp = Starfire.format(pp, opt);

      if(pp !== pppp) {
        throw new DebugError(`Starfire(input) !== Starfire(Starfire(input))\n${CliUtils.diff(pp, pppp)}`);
      } else {
        const normalizedOpts = Options.normalize(opt);
        const ast = CleanAst.cleanAST(
          Starfire.debug.parse(input, opt).ast,
          normalizedOpts
        );
        const past = CleanAst.cleanAST(
          Starfire.debug.parse(pp, opt).ast,
          normalizedOpts
        );

        if(ast !== past) {
          const MAX_AST_SIZE = 2097152; // 2MB
          const astDiff =
            ast.length > MAX_AST_SIZE || past.length > MAX_AST_SIZE
              ? 'AST diff too large to render'
              : CliUtils.diff(ast, past);
          throw new DebugError(
            `ast(input) !== ast(Starfire(input))\n${
              astDiff
            }\n${
              CliUtils.diff(input, pp)}`
          );
        }
      }

      return {formatted: opt.filePath || '(stdin)\n'};
    }

    return Starfire.formatWithCursor(input, opt);
  }

  static getOptionsOrDie(context, filePath): any {
    try {
      if(context.argv.config === false) {
        context.logger.debug(
          '\'--no-config\' option found, skip loading config file.'
        );
        return null;
      }

      context.logger.debug(
        context.argv.config
          ? `load config file from '${context.argv.config}'`
          : `resolve config from '${filePath}'`
      );

      const options = ResolveConfig.resolveConfigSync(filePath, {
        config: context.argv.config,
        editorconfig: context.argv.editorconfig
      });

      context.logger.debug(`loaded options \`${JSON.stringify(options)}\``);
      return options;
    } catch(error) {
      context.logger.error(`Invalid configuration file: ${error.message}`);
      process.exit(2);
    }
  }

  static getOptionsForFile(context, filePath: string): any {
    const options = CliUtils.getOptionsOrDie(context, filePath);
    const hasPlugins = options && options.plugins;

    if(hasPlugins) {
      CliUtils.pushContextPlugins(context, options.plugins);
    }

    const appliedOptions = {
      filePath,
      ...CliUtils.applyConfigPrecedence(
        context,
        options &&
        OptionsNormalizer.normalizeApiOptions(options, context.supportOptions, {
          logger: context.logger
        })
      )
    };

    context.logger.debug(
      `applied config-precedence (${context.argv['config-precedence']}): ` +
      `${JSON.stringify(appliedOptions)}`
    );

    if(hasPlugins) {
      CliUtils.popContextPlugins(context);
    }

    return appliedOptions;
  }

  static parseArgsToOptions(context, overrideDefaults?): any {
    const minimistOptions = CliUtils.createMinimistOptions(context.detailedOptions);
    const apiDetailedOptionMap = CliUtils.createApiDetailedOptionMap(context.detailedOptions);

    console.log('minimistOptions', minimistOptions);
    console.log('apiDetailedOptionMap', apiDetailedOptionMap);
    console.log('overrideDefaults', overrideDefaults);
    // return CliUtils.getOptions(
    //   OptionsNormalizer.normalizeCliOptions(
    //     minimist(
    //       context.args,
    //       {
    //         boolean: minimistOptions.boolean,
    //         default: CliUtils.cliifyOptions(overrideDefaults, apiDetailedOptionMap),
    //         string: minimistOptions.string
    //       }
    //     ),
    //     context.detailedOptions,
    //     {logger: false}
    //   ),
    //   context.detailedOptions
    // );
  }

  static applyConfigPrecedence(context, options): any {
    try {
      switch(context.argv['config-precedence']) {
        case 'cli-override':
          return CliUtils.parseArgsToOptions(context, options);
        case 'file-override':
          return {...CliUtils.parseArgsToOptions(context), options};
        case 'prefer-file':
          return options || CliUtils.parseArgsToOptions(context);
        default:
          return null;
      }
    } catch(error) {
      context.logger.error(error.toString());
      process.exit(2);
    }
  }

  static formatStdin(context): any {
    const filePath = context.argv['stdin-filepath']
      ? path.resolve(process.cwd(), context.argv['stdin-filepath'])
      : process.cwd();
    const ignorer = CliUtils.createIgnorer(context);
    const relativeFilepath = path.relative(process.cwd(), filePath);

    ThirdParty.getStream(process.stdin).then((input) => {
      if(relativeFilepath && ignorer.filter([relativeFilepath]).length === 0) {
        CliUtils.writeOutput({formatted: input}, {});
        return;
      }

      const options = CliUtils.getOptionsForFile(context, filePath);

      if(CliUtils.listDifferent(context, input, options, '(stdin)')) {
        return;
      }

      try {
        CliUtils.writeOutput(CliUtils.format(context, input, options), options);
      } catch(error) {
        CliUtils.handleError(context, 'stdin', error);
      }
    });
  }

  static createIgnorer(context): any {
    const ignoreFilePath = path.resolve(context.argv['ignore-path']);
    let ignoreText = '';

    try {
      ignoreText = fs.readFileSync(ignoreFilePath, 'utf8');
    } catch(readError) {
      if(readError.code !== 'ENOENT') {
        context.logger.error(
          `Unable to read ${ignoreFilePath}: ${readError.message}`
        );
        process.exit(2);
      }
    }

    return ignore().add(ignoreText);
  }

  static eachFilename(context, patterns, callback): void {
    const ignoreNodeModules = context.argv['with-node-modules'] !== true;
    let updatedPatterns = patterns;

    if(ignoreNodeModules) {
      updatedPatterns = patterns.concat(['!**/node_modules/**', '!./node_modules/**']);
    }

    try {
      const filePaths = globby
        .sync(updatedPatterns, {dot: true, nodir: true})
        .map((filePath) => path.relative(process.cwd(), filePath));

      if(filePaths.length === 0) {
        context.logger.error(`No matching files. Patterns tried: ${updatedPatterns.join(' ')}`);
        process.exitCode = 2;
        return;
      }
      filePaths.forEach((filePath) =>
        callback(filePath, CliUtils.getOptionsForFile(context, filePath))
      );
    } catch(error) {
      context.logger.error(
        `Unable to expand glob patterns: ${updatedPatterns.join(' ')}\n${error.message}`
      );
      // Don't exit the process if one pattern failed
      process.exitCode = 2;
    }
  }

  static formatFiles(context): any {
    // The ignorer will be used to filter file paths after the glob is checked,
    // before any files are actually written
    const ignorer = CliUtils.createIgnorer(context);

    CliUtils.eachFilename(context, context.filePatterns, (filePath, options) => {
      const fileIgnored = ignorer.filter([filePath]).length === 0;
      if(
        fileIgnored &&
        (context.argv['debug-check'] ||
          context.argv.write ||
          context.argv['list-different'])
      ) {
        return;
      }

      if(context.argv.write && process.stdout.isTTY) {
        // Don't use `console.log` here since we need to replace this line.
        context.logger.log(filePath, {newline: false});
      }

      let input;
      try {
        input = fs.readFileSync(filePath, 'utf8');
      } catch(error) {
        // Add newline to split errors from filename line.
        context.logger.log('');

        context.logger.error(
          `Unable to read file: ${filePath}\n${error.message}`
        );
        // Don't exit the process if one file failed
        process.exitCode = 2;
        return;
      }

      if(fileIgnored) {
        CliUtils.writeOutput({formatted: input}, options);
        return;
      }

      CliUtils.listDifferent(context, input, options, filePath);

      const start = Date.now();

      let result;
      let output;

      try {
        result = CliUtils.format(
          context,
          input,
          {...options, filePath}
        );
        output = result.formatted;
      } catch(error) {
        // Add newline to split errors from filename line.
        process.stdout.write('\n');

        CliUtils.handleError(context, filePath, error);
        return;
      }

      if(context.argv.write) {
        if(process.stdout.isTTY) {
          // Remove previously printed filename to log it with duration.
          readline.clearLine(process.stdout, 0);
          readline.cursorTo(process.stdout, 0, null);
        }

        // Don't write the file if it won't change in order not to invalidate
        // mtime based caches.
        if(output === input) {
          if(!context.argv['list-different']) {
            context.logger.log(`${chalk.gray(filePath)} ${Date.now() - start}ms`);
          }
        } else {
          if(context.argv['list-different']) {
            context.logger.log(filePath);
          } else {
            context.logger.log(`${filePath} ${Date.now() - start}ms`);
          }

          try {
            fs.writeFileSync(filePath, output, 'utf8');
          } catch(error) {
            context.logger.error(
              `Unable to write file: ${filePath}\n${error.message}`
            );
            // Don't exit the process if one file failed
            process.exitCode = 2;
          }
        }
      } else if(context.argv['debug-check']) {
        if(output) {
          context.logger.log(output);
        } else {
          process.exitCode = 2;
        }
      } else if(!context.argv['list-different']) {
        CliUtils.writeOutput(result, options);
      }
    });
  }

  static getOptionsWithOpposites(options): any {
    // Add --no-foo after --foo.
    const optionsWithOpposites = options.map((option) => [
      option.description ? option : null,
      option.oppositeDescription
        ? {
          ...option,
          description: option.oppositeDescription,
          name: `no-${option.name}`,
          type: 'boolean'
        }
        : null
    ]);

    return flatten(optionsWithOpposites).filter(Boolean);
  }

  static createUsage(context): string {
    const options = CliUtils.getOptionsWithOpposites(context.detailedOptions).filter(
      // remove unnecessary option (e.g. `semi`, `color`, etc.), which is only used for --help <flag>
      (option) =>
        !(
          option.type === 'boolean' &&
          option.oppositeDescription &&
          !option.name.startsWith('no-')
        )
    );

    const groupedOptions = groupBy(options, (option) => option.category);
    const firstCategories = CLIConstants.categoryOrder.slice(0, -1);
    const lastCategories = CLIConstants.categoryOrder.slice(-1);
    const restCategories = Object.keys(groupedOptions).filter(
      (category) =>
        firstCategories.indexOf(category) === -1 &&
        lastCategories.indexOf(category) === -1
    );
    const allCategories = firstCategories.concat(restCategories, lastCategories);

    const optionsUsage = allCategories.map((category) => {
      const categoryOptions = groupedOptions[category]
        .map((option) => CliUtils.createOptionUsage(context, option, CliUtils.OPTION_USAGE_THRESHOLD))
        .join('\n');
      return `${category} options:\n\n${CliUtils.indent(categoryOptions, 2)}`;
    });

    return [CLIConstants.usageSummary].concat(optionsUsage, ['']).join('\n\n');
  }

  static createOptionUsage(context, option, threshold): string {
    const header = CliUtils.createOptionUsageHeader(option);
    const optionDefaultValue = CliUtils.getOptionDefaultValue(context, option.name);
    const defaultLabel: string = `\nDefaults to ${CliUtils.createDefaultValueDisplay(optionDefaultValue)}.`;
    const optionDefaultLabel: string = optionDefaultValue === undefined ? '' : defaultLabel;
    return CliUtils.createOptionUsageRow(header, `${option.description}${optionDefaultLabel}`, threshold);
  }

  static createDefaultValueDisplay(value): string {
    return Array.isArray(value)
      ? `[${value.map(CliUtils.createDefaultValueDisplay).join(', ')}]`
      : value;
  }

  static createOptionUsageHeader(option): string {
    const name = `--${option.name}`;
    const alias = option.alias ? `-${option.alias},` : null;
    const type = CliUtils.createOptionUsageType(option);
    return [alias, name, type].filter(Boolean).join(' ');
  }

  static createOptionUsageRow(header, content, threshold): string {
    const separator =
      header.length >= threshold
        ? `\n${' '.repeat(threshold)}`
        : ' '.repeat(threshold - header.length);

    const description = content.replace(/\n/g, `\n${' '.repeat(threshold)}`);

    return `${header}${separator}${description}`;
  }

  static createOptionUsageType(option): string {
    switch(option.type) {
      case 'boolean':
        return null;
      case 'choice':
        return `<${option.choices
          .filter((choice) => !choice.deprecated)
          .map((choice) => choice.value)
          .join('|')}>`;
      default:
        return `<${option.type}>`;
    }
  }

  static getOptionWithLevenSuggestion(context, options, optionName): any {
    // support aliases
    const optionNameContainers = flatten(
      options.map((option, index) => [
        {value: option.name, index},
        option.alias ? {value: option.alias, index} : null
      ])
    ).filter(Boolean);

    const optionNameContainer = optionNameContainers.find((container) => container.value === optionName);

    if(optionNameContainer !== undefined) {
      return options[optionNameContainer.index];
    }

    const suggestedOptionNameContainer = optionNameContainers
      .find((container) => leven(container.value, optionName) < 3);

    if(suggestedOptionNameContainer !== undefined) {
      const suggestedOptionName = suggestedOptionNameContainer.value;
      context.logger.warn(`Unknown option name "${optionName}", did you mean "${suggestedOptionName}"?`);
      return options[suggestedOptionNameContainer.index];
    }

    context.logger.warn(`Unknown option name "${optionName}"`);
    return options.find((option) => option.name === 'help');
  }

  static createChoiceUsages(choices, margin, indentation): any {
    const activeChoices = choices.filter((choice) => !choice.deprecated);
    const threshold =
      activeChoices
        .map((choice) => choice.value.length)
        .reduce((current, length) => Math.max(current, length), 0) + margin;
    return activeChoices.map((choice) =>
      CliUtils.indent(
        CliUtils.createOptionUsageRow(choice.value, choice.description, threshold),
        indentation
      )
    );
  }

  static createDetailedUsage(context, optionName): any {
    const option = CliUtils.getOptionWithLevenSuggestion(
      context,
      CliUtils.getOptionsWithOpposites(context.detailedOptions),
      optionName
    );

    const header = CliUtils.createOptionUsageHeader(option);
    const description = `\n\n${CliUtils.indent(option.description, 2)}`;

    const choices =
      option.type !== 'choice'
        ? ''
        : `\n\nValid options:\n\n${CliUtils.createChoiceUsages(
          option.choices,
          CliUtils.CHOICE_USAGE_MARGIN,
          CliUtils.CHOICE_USAGE_INDENTATION
        ).join('\n')}`;

    const optionDefaultValue = CliUtils.getOptionDefaultValue(context, option.name);
    const defaults =
      optionDefaultValue !== undefined
        ? `\n\nDefault: ${CliUtils.createDefaultValueDisplay(optionDefaultValue)}`
        : '';

    const pluginDefaults =
      option.pluginDefaults && Object.keys(option.pluginDefaults).length
        ? `\nPlugin defaults:${Object.keys(option.pluginDefaults).map(
          (key) =>
            `\n* ${key}: ${CliUtils.createDefaultValueDisplay(
              option.pluginDefaults[key]
            )}`
        )}`
        : '';
    return `${header}${description}${choices}${defaults}${pluginDefaults}`;
  }

  static getOptionDefaultValue(context, optionName): any {
    // --no-option
    if(!(optionName in context.detailedOptionMap)) {
      return undefined;
    }

    const option = context.detailedOptionMap[optionName];

    if(option.default !== undefined) {
      return option.default;
    }

    const optionCamelName = camelCase(optionName);
    if(optionCamelName in context.apiDefaultOptions) {
      return context.apiDefaultOptions[optionCamelName];
    }

    return undefined;
  }

  static indent(str, spaces): string {
    return str.replace(/^/gm, ' '.repeat(spaces));
  }

  static createLogger(logLevel): LogFunctionType {
    const shouldLog = (loggerName) => {
      if(logLevel === 'silent') {
        return false;
      } else if(logLevel === 'debug' || logLevel === 'log' || logLevel === 'warn') {
        if(loggerName === 'debug' || loggerName === 'log' || loggerName === 'warn') {
          return true;
        }
        return loggerName === 'error';
      }
      return true;
    };

    const createLogFunc = (loggerName, color?) => {
      if(!shouldLog(loggerName)) {
        return () => {};
      }

      const prefix = color ? `[${chalk[color](loggerName)}] ` : '';

      return (message, opts) => {
        opts = {newline: true, ...opts};
        const stream = process[loggerName === 'log' ? 'stdout' : 'stderr'];
        stream.write(message.replace(/^/gm, prefix) + (opts.newline ? '\n' : ''));
      };
    };

    return {
      debug: createLogFunc('debug', 'blue'),
      error: createLogFunc('error', 'red'),
      log: createLogFunc('log'),
      warn: createLogFunc('warn', 'yellow')
    };
  }

  static normalizeDetailedOption(name, option): any {
    return {
      category: CLIConstants.CATEGORY_OTHER, ...option,
      choices:
        option.choices &&
        option.choices.map((choice) => {
          const newChoice = {
            deprecated: false,
            description: '',
            ...(typeof choice === 'object' ? choice : {value: choice})
          };
          if(newChoice.value === true) {
            newChoice.value = ''; // backward compability for original boolean option
          }
          return newChoice;
        })
    };
  }

  static normalizeDetailedOptionMap(detailedOptionMap): any {
    return Object.keys(detailedOptionMap)
      .sort()
      .reduce((normalized, name) => {
        const option = detailedOptionMap[name];
        return {
          ...normalized,
          [name]: CliUtils.normalizeDetailedOption(name, option)
        };
      }, {});
  }

  static createMinimistOptions(detailedOptions): any {
    return {
      alias: detailedOptions
        .filter((option) => option.alias !== undefined)
        .reduce(
          (current, option) =>
            ({[option.name]: option.alias, ...current}),
          {}
        ),
      boolean: detailedOptions
        .filter((option) => option.type === 'boolean')
        .map((option) => option.name),
      default: detailedOptions
        .filter((option) => !option.deprecated)
        .filter((option) => !option.forwardToApi || option.name === 'plugin')
        .filter((option) => option.default !== undefined)
        .reduce(
          (current, option) =>
            ({[option.name]: option.default, ...current}),
          {}
        ),
      string: detailedOptions
        .filter((option) => option.type !== 'boolean')
        .map((option) => option.name)
    };
  }

  static createApiDetailedOptionMap(detailedOptions): any {
    return detailedOptions.reduce(
      (current, option) =>
        (option.forwardToApi && option.forwardToApi !== option.name
          ? {...current, [option.forwardToApi]: option}
          : current),
      {}
    );
  }

  static createDetailedOptionMap(supportOptions): any {
    return supportOptions.reduce((reduced, option) => {
      const newOption = {
        ...option,
        category: option.cliCategory || CLIConstants.CATEGORY_FORMAT,
        description: option.cliDescription || option.description,
        forwardToApi: option.name,
        name: option.cliName || dashify(option.name)
      };

      if(option.deprecated) {
        delete newOption.forwardToApi;
        delete newOption.description;
        delete newOption.oppositeDescription;
        newOption.deprecated = true;
      }

      return {...reduced, [newOption.name]: newOption};
    }, {});
  }

  static createContext(args): any {
    const context: CLIContextType = {args};

    CliUtils.updateContextArgv(context);
    CliUtils.normalizeContextArgv(context, ['loglevel', 'plugin']);

    context.logger = CliUtils.createLogger(context.argv.loglevel);

    CliUtils.updateContextArgv(context, context.argv.plugin);

    return context;
  }

  static initContext(context): void {
    // split into 2 step so that we could wrap this in a `try..catch` in cli/index.js
    CliUtils.normalizeContextArgv(context);
  }

  static updateContextOptions(context, plugins): void {
    const supportOptions = Support.getSupportInfo(null, {
      plugins,
      showDeprecated: true,
      showInternal: true,
      showUnreleased: true
    }).options;
    const detailedOptionMap = CliUtils.normalizeDetailedOptionMap(
      {...CliUtils.createDetailedOptionMap(supportOptions), ...CLIConstants.options}
    );
    const detailedOptions = Util.arrayify(detailedOptionMap, 'name');
    const apiDefaultOptions = supportOptions
      .filter((optionInfo) => !optionInfo.deprecated)
      .reduce(
        (reduced, optionInfo) =>
          ({...reduced, [optionInfo.name]: optionInfo.default}),
        {...Options.hiddenDefaults}
      );

    context.supportOptions = supportOptions;
    context.detailedOptions = detailedOptions;
    context.detailedOptionMap = detailedOptionMap;
    context.apiDefaultOptions = apiDefaultOptions;
  }

  static pushContextPlugins(context, plugins): void {
    context._supportOptions = context.supportOptions;
    context._detailedOptions = context.detailedOptions;
    context._detailedOptionMap = context.detailedOptionMap;
    context._apiDefaultOptions = context.apiDefaultOptions;
    CliUtils.updateContextOptions(context, plugins);
  }

  static popContextPlugins(context): void {
    context.supportOptions = context._supportOptions;
    context.detailedOptions = context._detailedOptions;
    context.detailedOptionMap = context._detailedOptionMap;
    context.apiDefaultOptions = context._apiDefaultOptions;
  }

  static updateContextArgv(context, plugins?): void {
    // CliUtils.pushContextPlugins(context, plugins);

    // const minimistOptions = CliUtils.createMinimistOptions(context.detailedOptions);
    // const argv = minimist(context.args, minimistOptions);

    // context.argv = argv;
    // context.filePatterns = argv['_'];
  }

  static normalizeContextArgv(context, keys?): void {
    const detailedOptions = !keys
      ? context.detailedOptions
      : context.detailedOptions.filter(
        (option) => keys.indexOf(option.name) !== -1
      );
    const argv = !keys ? context.argv : pick(context.argv, keys);

    context.argv = OptionsNormalizer.normalizeCliOptions(argv, detailedOptions, {logger: context.logger});
  }
}
