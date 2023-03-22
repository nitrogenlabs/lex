/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import graphqlLoaderPlugin from '@luckycatfactory/esbuild-graphql-loader';
import {build as esBuild} from 'esbuild';
import {execa} from 'execa';
import {resolve as pathResolve} from 'path';
import {fileURLToPath} from 'url';

import {LexConfig} from '../LexConfig.js';
import {checkLinkedModules, createSpinner, removeFiles} from '../utils/app.js';
import {relativeNodePath} from '../utils/file.js';
import {log} from '../utils/log.js';

export const buildWithEsBuild = async (spinner, cmd, callback) => {
  const {
    cliName = 'Lex',
    outputPath,
    quiet,
    sourcePath,
    watch
  } = cmd;
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

  // Plugins
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
      watch
    });

    // Stop spinner
    spinner.succeed('Build completed successfully!');
  } catch(error) {
    // Display error message
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    if(!quiet) {
      console.error(error);
    }

    // Stop spinner
    spinner.fail('Code build failed.');

    // Kill Process
    callback(error.status);
    return error.status;
  }

  // Stop process
  callback(0);
  return 0;
};

export const buildWithWebpack = async (spinner, cmd, callback) => {
  const {
    buildDelimiter,
    cliName = 'Lex',
    config,
    mode,
    outputChunkFilename,
    outputFilename,
    outputJsonpFunction,
    outputLibrary,
    outputLibraryTarget,
    outputPathInfo,
    outputPublicPath,
    outputSourceMapFilename,
    quiet = false,
    watch
  } = cmd;

  // Get custom webpack configuration
  let webpackConfig: string;

  if(config) {
    const isRelativeConfig: boolean = config.substr(0, 2) === './';
    const fullConfigPath: string = isRelativeConfig ? pathResolve(process.cwd(), config) : config;
    webpackConfig = fullConfigPath;
  } else {
    const dirName = fileURLToPath(new URL('.', import.meta.url));
    webpackConfig = pathResolve(dirName, '../../webpack.config.js');
  }

  const webpackOptions: string[] = [
    '--color',
    '--progress',
    '--stats-error-details',
    '--config', webpackConfig
  ];

  if(mode) {
    webpackOptions.push('--mode', mode);
  }

  if(outputChunkFilename) {
    webpackOptions.push('--output-chunk-filename', outputChunkFilename);
  }

  if(outputFilename) {
    webpackOptions.push('--output-filename', outputFilename);
  }

  if(outputJsonpFunction) {
    webpackOptions.push('--output-jsonp-function', outputJsonpFunction);
  }

  if(outputLibrary) {
    webpackOptions.push('--output-library', outputLibrary);
  }

  if(outputLibraryTarget) {
    webpackOptions.push('--output-library-target', outputLibraryTarget);
  }

  if(outputPathInfo) {
    webpackOptions.push('--output-path-info', outputPathInfo);
  }

  if(outputPublicPath) {
    webpackOptions.push('--output-public-path', outputPublicPath);
  }

  if(outputSourceMapFilename) {
    webpackOptions.push('--output-source-map-filename', outputSourceMapFilename);
  }

  if(buildDelimiter) {
    webpackOptions.push('--build-delimiter', buildDelimiter);
  }

  if(watch) {
    webpackOptions.push('--watch');
  }

  // Compile using webpack
  try {
    const dirName = fileURLToPath(new URL('.', import.meta.url));
    const nodePath: string = pathResolve(dirName, '../../node_modules');
    const webpackPath: string = relativeNodePath('webpack-cli/bin/cli.js', nodePath);
    await execa(webpackPath, webpackOptions, {encoding: 'utf-8', stdio: 'inherit'});

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
    callback(error.status);
    return error.status;
  }
};

export const build = async (cmd: any, callback: any = () => ({})): Promise<number> => {
  const {
    bundler = 'webpack',
    cliName = 'Lex',
    quiet = false,
    remove,
    variables
  } = cmd;

  // Spinner
  const spinner = createSpinner(quiet);

  // Display status
  log(`${cliName} building...`, 'info', quiet);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

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

