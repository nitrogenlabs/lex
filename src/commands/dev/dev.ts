/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import {dirname, resolve as pathResolve} from 'path';

import {LexConfig} from '../../LexConfig.js';
import {createSpinner, removeFiles} from '../../utils/app.js';
import {resolveWebpackPaths} from '../../utils/file.js';
import {log} from '../../utils/log.js';

let currentFilename: string;
let currentDirname: string;

try {
  currentFilename = eval('require("url").fileURLToPath(import.meta.url)');
  currentDirname = dirname(currentFilename);
} catch {
  currentFilename = process.cwd();
  currentDirname = process.cwd();
}

export interface DevOptions {
  readonly bundleAnalyzer?: boolean;
  readonly cliName?: string;
  readonly config?: string;
  readonly open?: boolean;
  readonly quiet?: boolean;
  readonly remove?: boolean;
  readonly variables?: string;
}

export type DevCallback = (status: number) => void;

export const dev = async (cmd: DevOptions, callback: DevCallback = () => ({})): Promise<number> => {
  const {bundleAnalyzer, cliName = 'Lex', config, open = false, quiet, remove, variables} = cmd;

  const spinner = createSpinner(quiet);

  log(`${cliName} start development server...`, 'info', quiet);

  await LexConfig.parseConfig(cmd);

  const {outputFullPath, useTypescript} = LexConfig.config;

  let variablesObj: object = {NODE_ENV: 'development'};

  if(variables) {
    try {
      variablesObj = JSON.parse(variables);
    } catch(_error) {
      log(`\n${cliName} Error: Environment variables option is not a valid JSON object.`, 'error', quiet);
      callback(1);
      return 1;
    }
  }

  process.env = {...process.env, ...variablesObj};

  if(useTypescript) {
    LexConfig.checkTypescriptConfig();
  }

  if(remove) {
    spinner.start('Cleaning output directory...');

    await removeFiles(outputFullPath || '');

    spinner.succeed('Successfully cleaned output directory!');
  }

  let webpackConfig: string;
  let webpackPath: string;

  if(config) {
    const isRelativeConfig: boolean = config.substr(0, 2) === './';
    webpackConfig = isRelativeConfig ? pathResolve(process.cwd(), config) : config;
  } else {
    const {webpackConfig: resolvedConfig} = resolveWebpackPaths(currentDirname);
    webpackConfig = resolvedConfig;
  }

  const {webpackPath: resolvedPath} = resolveWebpackPaths(currentDirname);
  webpackPath = resolvedPath;

  const webpackOptions: string[] = [
    '--color',
    '--watch',
    '--config', webpackConfig
  ];

  if(bundleAnalyzer) {
    webpackOptions.push('--bundleAnalyzer');
  }

  try {
    const finalWebpackOptions = webpackPath === 'npx' ? ['webpack', ...webpackOptions] : webpackOptions;

    await execa(webpackPath, finalWebpackOptions, {
      encoding: 'utf8',
      env: {
        LEX_QUIET: quiet,
        WEBPACK_DEV_OPEN: open
      },
      stdio: 'inherit'
    } as any);

    spinner.succeed('Development server started.');

    callback(0);
    return 0;
  } catch(error) {
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    spinner.fail('There was an error while running Webpack.');

    callback(1);
    return 1;
  }
};