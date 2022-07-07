import execa from 'execa';
import * as path from 'path';

import {LexConfig} from '../LexConfig';
import {createSpinner} from '../utils/app';
import {relativeFilePath} from '../utils/file';
import {log} from '../utils/log';

export const lint = async (cmd: any, callback: any = process.exit): Promise<number> => {
  const {
    noEslintrc = true,
    cliName = 'Lex',
    config,
    env,
    ext,
    global,
    parser,
    parserOptions,
    resolvePluginsRelativeTo,
    rulesdir,
    plugin,
    rule,
    fix,
    fixDryRun,
    fixType,
    ignorePath,
    noIgnore,
    ignorePattern,
    stdin,
    stdinFilename,
    quiet,
    maxWarnings,
    outputFile,
    format,
    color,
    noColor,
    noInlineConfig,
    reportUnusedDisableDirectives,
    cache,
    cacheFile,
    cacheLocation,
    init,
    envInfo,
    debug,
    version,
    printConfig
  } = cmd;

  log(`${cliName} linting...`, 'info', quiet);

  // Spinner
  const spinner = createSpinner(quiet);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  const {useTypescript} = LexConfig.config;

  if(useTypescript) {
    // Make sure tsconfig.json exists
    LexConfig.checkTypescriptConfig();
  }

  // Configure jest
  const nodePath: string = path.resolve(__dirname, '../../node_modules');
  const eslintPath: string = relativeFilePath('jest-cli/bin/jest.js', nodePath);
  const eslintOptions: string[] = [];

  if(noEslintrc) {
    eslintOptions.push('--bail');
  }

  if(env) {
    eslintOptions.push('--env', env);
  }

  if(ext) {
    eslintOptions.push('--ext', ext);
  }

  if(global) {
    eslintOptions.push('--global', global);
  }

  if(parser) {
    eslintOptions.push('--parser', parser);
  }

  if(parserOptions) {
    eslintOptions.push('--parser-options', parserOptions);
  }

  if(resolvePluginsRelativeTo) {
    eslintOptions.push('--resolve-plugins-relative-to', resolvePluginsRelativeTo);
  }

  if(rulesdir) {
    eslintOptions.push('--rulesdir', rulesdir);
  }

  if(plugin) {
    eslintOptions.push('--plugin', plugin);
  }

  if(rule) {
    eslintOptions.push('--rule', rule);
  }

  if(fix) {
    eslintOptions.push('--fix');
  }

  if(fixDryRun) {
    eslintOptions.push('--fix-dry-run');
  }

  if(fixType) {
    eslintOptions.push('--fix-type', fixType);
  }

  if(ignorePath) {
    eslintOptions.push('--ignore-path', ignorePath);
  }

  if(noIgnore) {
    eslintOptions.push('--no-ignore');
  }

  if(ignorePattern) {
    eslintOptions.push('--ignore-pattern', ignorePattern);
  }

  if(stdin) {
    eslintOptions.push('--stdin');
  }

  if(stdinFilename) {
    eslintOptions.push('--stdin-filename', stdinFilename);
  }

  if(maxWarnings) {
    eslintOptions.push('--max-warnings', maxWarnings);
  }

  if(outputFile) {
    eslintOptions.push('--output-file', outputFile);
  }

  if(format) {
    eslintOptions.push('--format', format);
  }

  if(color) {
    eslintOptions.push('--color');
  }

  if(noColor) {
    eslintOptions.push('--no-color');
  }

  if(noInlineConfig) {
    eslintOptions.push('--no-inline-config', noInlineConfig);
  }

  if(reportUnusedDisableDirectives) {
    eslintOptions.push('--report-unused-disable-directives');
  }

  if(cache) {
    eslintOptions.push('--cache');
  }

  if(cacheFile) {
    eslintOptions.push('--cache-file', cacheFile);
  }

  if(cacheLocation) {
    eslintOptions.push('--cache-location', cacheLocation);
  }

  if(cacheLocation) {
    eslintOptions.push('--cache-location', cacheLocation);
  }

  if(init) {
    eslintOptions.push('--init');
  }

  if(envInfo) {
    eslintOptions.push('--env-info');
  }

  if(debug) {
    eslintOptions.push('--debug');
  }

  if(printConfig) {
    eslintOptions.push('--print-config', printConfig);
  }

  // Test app using jest
  try {
    await execa(eslintPath, eslintOptions, {
      encoding: 'utf-8',
      stdio: 'inherit'
    });

    spinner.succeed('Testing completed!');

    // Kill process
    callback(0);
    return 0;
  } catch(error) {
    // Display error message
    log(`\n${cliName} Error: Check for unit test errors and/or coverage.`, 'error', quiet);

    // Stop spinner
    spinner.fail('Testing failed!');

    // Kill process
    callback(error.status);
    return error.status;
  }
};
