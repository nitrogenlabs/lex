/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import graphqlLoaderPlugin from '@luckycatfactory/esbuild-graphql-loader';
import {build as esBuild} from 'esbuild';
import {execa} from 'execa';
import {resolve as pathResolve} from 'path';
import {URL} from 'url';

import {LexConfig} from '../LexConfig.js';
import {checkLinkedModules, createSpinner, removeFiles} from '../utils/app.js';
import {relativeNodePath} from '../utils/file.js';
import {log} from '../utils/log.js';

export interface BuildOptions {
  readonly bundler?: 'webpack' | 'esbuild';
  readonly cliName?: string;
  readonly outputPath?: string;
  readonly quiet?: boolean;
  readonly remove?: boolean;
  readonly sourcePath?: string;
  readonly variables?: string;
  readonly watch?: boolean;
}

export type BuildCallback = (status: number) => void;

export const buildWithEsBuild = async (spinner, commandOptions: BuildOptions, callback: BuildCallback) => {
  const {
    cliName = 'Lex',
    outputPath,
    quiet,
    sourcePath,
    watch = false
  } = commandOptions;
  const {
    targetEnvironment,
    useGraphQl,
    useTypescript
  } = LexConfig.config;
  const loader: any = {
    '.js': 'js'
  };

  if(useTypescript) {
    loader['.ts'] = 'ts';
    loader['.tsx'] = 'tsx';
  }

  const plugins = [];

  if(useGraphQl) {
    plugins.push(graphqlLoaderPlugin());
  }

  try {
    await esBuild({
      bundle: true,
      color: true,
      entryPoints: [sourcePath],
      loader,
      outdir: outputPath,
      platform: 'node',
      plugins,
      sourcemap: 'inline',
      target: targetEnvironment === 'node' ? 'node18' : 'es2016',
      watch: watch as never
    });

    spinner.succeed('Build completed successfully!');
  } catch(error) {
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    if(!quiet) {
      console.error(error);
    }

    spinner.fail('Code build failed.');

    callback(1);
    return 1;
  }

  callback(0);
  return 0;
};

export const buildWithWebpack = async (spinner, cmd, callback) => {
  const {
    analyze,
    cliName = 'Lex',
    config,
    configName,
    defineProcessEnvNodeEnv,
    devtool,
    disableInterpret,
    entry,
    env,
    failOnWarnings,
    json,
    merge,
    mode,
    name,
    nodeEnv,
    noDevtool,
    noStats,
    noTarget,
    noWatch,
    noWatchOptionsStdin,
    outputPath,
    quiet = false,
    stats,
    target,
    watch,
    watchOptionsStdin
  } = cmd;

  // Get custom webpack configuration
  let webpackConfig: string;
  const dirName = new URL('.', import.meta.url).pathname;

  if(config) {
    const isRelativeConfig: boolean = config.substr(0, 2) === './';
    webpackConfig = isRelativeConfig ? pathResolve(process.cwd(), config) : config;
  } else {
    webpackConfig = pathResolve(dirName, '../../webpack.config.js');
  }

  const webpackOptions: string[] = [
    '--color',
    '--progress',
    '--config', webpackConfig
  ];

  if(analyze) {
    webpackOptions.push('--analyze');
  }

  if(configName) {
    webpackOptions.push('--configName', configName);
  }

  if(defineProcessEnvNodeEnv) {
    webpackOptions.push('--defineProcessEnvNodeEnv', defineProcessEnvNodeEnv);
  }

  if(devtool) {
    webpackOptions.push('--devtool', devtool);
  }

  if(disableInterpret) {
    webpackOptions.push('--disableInterpret');
  }

  if(entry) {
    webpackOptions.push('--entry', entry);
  }

  if(env) {
    webpackOptions.push('--env', env);
  }

  if(failOnWarnings) {
    webpackOptions.push('--failOnWarnings');
  }

  if(json) {
    webpackOptions.push('--json', json);
  }

  if(mode) {
    webpackOptions.push('--mode', mode);
  }

  if(merge) {
    webpackOptions.push('--merge');
  }

  if(name) {
    webpackOptions.push('--name', name);
  }

  if(noDevtool) {
    webpackOptions.push('--noDevtool');
  }

  if(noStats) {
    webpackOptions.push('--noStats');
  }

  if(noTarget) {
    webpackOptions.push('--noTarget');
  }

  if(noWatch) {
    webpackOptions.push('--noWatch');
  }

  if(noWatchOptionsStdin) {
    webpackOptions.push('--noWatchOptionsStdin');
  }

  if(nodeEnv) {
    webpackOptions.push('--nodeEnv', nodeEnv);
  }

  if(outputPath) {
    webpackOptions.push('--outputPath', outputPath);
  }

  if(stats) {
    webpackOptions.push('--stats', stats);
  }

  if(target) {
    webpackOptions.push('--target', target);
  }

  if(watch) {
    webpackOptions.push('--watch');
  }

  if(watchOptionsStdin) {
    webpackOptions.push('--watchOptionsStdin');
  }

  // Compile using webpack
  const dirPath: string = pathResolve(dirName, '../..');

  try {
    const webpackPath: string = relativeNodePath('webpack-cli/bin/cli.js', dirPath);
    await execa(webpackPath, webpackOptions, {encoding: 'utf8', stdio: 'inherit'});

    // Stop spinner
    spinner.succeed('Build completed successfully!');

    // Stop process
    callback(0);
    return 0;
  } catch(error) {
    // Display error message
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    // Stop spinner
    spinner.fail('Build failed.');

    // Kill process
    callback(1);
    return 1;
  }
};

export const build = async (cmd: any, callback: any = () => ({})): Promise<number> => {
  const {
    bundler = 'webpack',
    cliName = 'Lex',
    quiet = false,
    remove = false,
    variables = '{}'
  } = cmd;

  // Spinner
  const spinner = createSpinner(quiet);

  // Display status
  log(`${cliName} building...`, 'info', quiet);

  // Get custom configuration
  await LexConfig.parseConfig(cmd);

  const {outputFullPath, useTypescript} = LexConfig.config;

  // Check for linked modules
  checkLinkedModules();

  // Set node environment variables
  let variablesObj: object = {NODE_ENV: 'production'};

  if(variables) {
    try {
      variablesObj = JSON.parse(variables);
    } catch(error) {
      log(`\n${cliName} Error: Environment variables option is not a valid JSON object.`, 'error', quiet);

      // Kill process
      callback(1);
      return 1;
    }
  }

  process.env = {...process.env, ...variablesObj};

  // Start build spinner
  spinner.start('Building code...');

  // Clean output directory before we start adding in new files
  if(remove) {
    await removeFiles(outputFullPath);
  }

  // Add tsconfig file if none exists
  if(useTypescript) {
    // Make sure tsconfig.json exists
    LexConfig.checkTypescriptConfig();
  }

  if(bundler === 'esbuild') {
    return buildWithEsBuild(spinner, cmd, callback);
  }

  return buildWithWebpack(spinner, cmd, callback);
};

export default build;
