/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import {resolve as pathResolve} from 'path';
import {URL} from 'url';

import {LexConfig} from '../LexConfig.js';
import {createSpinner} from '../utils/app.js';
import {relativeNodePath} from '../utils/file.js';
import {log} from '../utils/log.js';

export interface LintOptions {
  readonly cache?: boolean;
  readonly cacheFile?: string;
  readonly cacheLocation?: string;
  readonly cliName?: string;
  readonly color?: boolean;
  readonly config?: string;
  readonly debug?: boolean;
  readonly env?: string;
  readonly envInfo?: boolean;
  readonly ext?: string;
  readonly fix?: boolean;
  readonly fixDryRun?: boolean;
  readonly fixType?: string;
  readonly format?: string;
  readonly global?: string;
  readonly ignorePath?: string;
  readonly ignorePattern?: string;
  readonly init?: boolean;
  readonly maxWarnings?: string;
  readonly noColor?: boolean;
  readonly noEslintrc?: boolean;
  readonly noIgnore?: boolean;
  readonly noInlineConfig?: boolean;
  readonly outputFile?: string;
  readonly parser?: string;
  readonly parserOptions?: string;
  readonly plugin?: string;
  readonly printConfig?: string;
  readonly quiet?: boolean;
  readonly reportUnusedDisableDirectives?: boolean;
  readonly resolvePluginsRelativeTo?: string;
  readonly rule?: string;
  readonly rulesdir?: string;
  readonly stdin?: boolean;
  readonly stdinFilename?: string;
}

export type LintCallback = typeof process.exit;

export const lint = async (cmd: LintOptions, callback: LintCallback = process.exit): Promise<number> => {
  const {
    cache,
    cacheFile,
    cacheLocation,
    cliName = 'Lex',
    color,
    config,
    debug,
    env,
    envInfo,
    ext = '.js',
    fix,
    fixDryRun,
    fixType,
    format,
    global,
    ignorePath,
    ignorePattern,
    init,
    maxWarnings,
    noColor,
    noEslintrc = true,
    noIgnore,
    noInlineConfig,
    outputFile,
    parser,
    parserOptions,
    plugin,
    printConfig,
    quiet,
    reportUnusedDisableDirectives,
    resolvePluginsRelativeTo,
    rule,
    rulesdir,
    stdin,
    stdinFilename
  } = cmd;

  log(`${cliName} linting...`, 'info', quiet);

  // Spinner
  const spinner = createSpinner(quiet);

  // Get custom configuration
  await LexConfig.parseConfig(cmd);

  const {useTypescript} = LexConfig.config;
  let extensions = ext;

  if(useTypescript) {
    LexConfig.checkTypescriptConfig();
    extensions = '.ts,.tsx';
  }

  // Configure jest
  const dirName = new URL('.', import.meta.url).pathname;
  const dirPath: string = pathResolve(dirName, '../..');
  const eslintPath: string = relativeNodePath('eslint/bin/eslint.js', dirPath);
  const eslintOptions: string[] = ['./src'];

  if(noEslintrc) {
    eslintOptions.push('--no-eslintrc');
  }

  if(config) {
    eslintOptions.push('--config', config);
  } else {
    let configPath: string;

    if(useTypescript) {
      configPath = relativeNodePath('eslint-config-styleguidejs/typescript.js', dirPath);
    } else {
      configPath = relativeNodePath('eslint-config-styleguidejs/react.js', dirPath);
    }
    eslintOptions.push('--config', configPath);
  }

  if(env) {
    eslintOptions.push('--env', env);
  }

  if(global) {
    eslintOptions.push('--global', global);
  }

  if(parser) {
    eslintOptions.push('--parser', parser);
  }

  if(parserOptions) {
    eslintOptions.push('--parserOptions', parserOptions);
  }

  if(resolvePluginsRelativeTo) {
    eslintOptions.push('--resolvePluginsRelativeTo', resolvePluginsRelativeTo);
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
    eslintOptions.push('--fixDryRun');
  }

  if(fixType) {
    eslintOptions.push('--fixType', fixType);
  }

  if(ignorePath) {
    eslintOptions.push('--ignorePath', ignorePath);
  }

  if(noIgnore) {
    eslintOptions.push('--noIgnore');
  }

  if(ignorePattern) {
    eslintOptions.push('--ignorePattern', ignorePattern);
  }

  if(stdin) {
    eslintOptions.push('--stdin');
  }

  if(stdinFilename) {
    eslintOptions.push('--stdinFilename', stdinFilename);
  }

  if(maxWarnings) {
    eslintOptions.push('--maxWarnings', maxWarnings);
  }

  if(outputFile) {
    eslintOptions.push('--outputFile', outputFile);
  }

  if(format) {
    eslintOptions.push('--format', format);
  }

  if(color) {
    eslintOptions.push('--color');
  }

  if(noColor) {
    eslintOptions.push('--noColor');
  }

  if(noInlineConfig) {
    eslintOptions.push('--noInlineConfig', noInlineConfig ? 'true' : 'false');
  }

  if(reportUnusedDisableDirectives) {
    eslintOptions.push('--reportUnusedDisableDirectives');
  }

  if(cacheLocation) {
    eslintOptions.push('--cacheLocation', cacheLocation);
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
    eslintOptions.push('--printConfig', printConfig);
  }

  // Test app using jest
  try {
    await execa(eslintPath, eslintOptions, {
      encoding: 'utf8',
      stdio: 'inherit'
    });

    spinner.succeed('Linting completed!');

    // Kill process
    callback(0);
    return 0;
  } catch(error) {
    // Display error message
    log(`\n${cliName} Error: Check for unit test errors and/or coverage.`, 'error', quiet);

    // Stop spinner
    spinner.fail('Testing failed!');

    // Kill process
    callback(1);
    return 1;
  }
};
