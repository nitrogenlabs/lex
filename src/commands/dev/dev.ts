/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import {dirname, resolve as pathResolve} from 'path';

import {LexConfig} from '../../LexConfig.js';
import {createSpinner, createProgressBar, handleWebpackProgress, removeFiles} from '../../utils/app.js';
import {resolveWebpackPaths} from '../../utils/file.js';
import {log} from '../../utils/log.js';
import boxen from 'boxen';
import chalk from 'chalk';

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

const displayServerStatus = (port: number = 3000, host: string = 'localhost', quiet: boolean) => {
  if(quiet) return;

  const url = `http://${host}:${port}`;
  const localUrl = `http://localhost:${port}`;
  const networkUrl = `http://${host}:${port}`;

  const statusBox = boxen(
    `${chalk.cyan.bold('🚀 Development Server Running')}\n\n` +
    `${chalk.green('Local:')}     ${chalk.underline(localUrl)}\n` +
    `${chalk.green('Network:')}   ${chalk.underline(networkUrl)}\n\n` +
    `${chalk.yellow('Press Ctrl+C to stop the server')}`,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      backgroundColor: '#1a1a1a'
    }
  );

  console.log('\n' + statusBox + '\n');
};

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

    spinner.start('Starting development server...');

    const childProcess = execa(webpackPath, finalWebpackOptions, {
      encoding: 'utf8',
      env: {
        LEX_QUIET: quiet,
        WEBPACK_DEV_OPEN: open
      },
      stdio: 'pipe'
    } as any);

    let serverStarted = false;
    let detectedPort = 3000;

    childProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();

      handleWebpackProgress(output, spinner, quiet, '🚀', 'Webpack Building');

      if(!serverStarted && (output.includes('Local:') || output.includes('webpack compiled'))) {
        serverStarted = true;
        spinner.succeed('Development server started.');

        const portMatch = output.match(/Local:\s*http:\/\/[^:]+:(\d+)/);
        if(portMatch) {
          detectedPort = parseInt(portMatch[1], 10);
        }

        displayServerStatus(detectedPort, 'localhost', quiet);
      }
    });

    childProcess.stderr?.on('data', (data: Buffer) => {
      const output = data.toString();

      handleWebpackProgress(output, spinner, quiet, '🚀', 'Webpack Building');

      if(!serverStarted && (output.includes('Local:') || output.includes('webpack compiled'))) {
        serverStarted = true;
        spinner.succeed('Development server started.');

        const portMatch = output.match(/Local:\s*http:\/\/[^:]+:(\d+)/);
        if(portMatch) {
          detectedPort = parseInt(portMatch[1], 10);
        }

        displayServerStatus(detectedPort, 'localhost', quiet);
      }
    });

    setTimeout(() => {
      if(!serverStarted) {
        spinner.succeed('Development server started.');
        displayServerStatus(detectedPort, 'localhost', quiet);
      }
    }, 3000);

    await childProcess;

    if(!serverStarted) {
      spinner.succeed('Development server started.');
      displayServerStatus(detectedPort, 'localhost', quiet);
    }

    callback(0);
    return 0;
  } catch(error) {
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    spinner.fail('There was an error while running Webpack.');

    callback(1);
    return 1;
  }
};