/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import execa from 'execa';
import * as path from 'path';

import {LexConfig} from '../LexConfig';
import {checkLinkedModules, createSpinner, log, relativeFilePath, removeFiles} from '../utils';

export const build = async (cmd: any, callback: any = () => ({})): Promise<number> => {
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
    outputPathinfo,
    outputPublicPath,
    outputSourceMapFilename,
    quiet = false,
    remove,
    variables,
    watch
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
  spinner.start('Building with Webpack...');

  // Clean output directory before we start adding in new files
  if(remove) {
    await removeFiles(outputFullPath);
  }

  // Add tsconfig file if none exists
  if(useTypescript) {
    // Make sure tsconfig.json exists
    LexConfig.checkTypescriptConfig();
  }

  // Get custom webpack configuration
  let webpackConfig: string;

  if(config) {
    const isRelativeConfig: boolean = config.substr(0, 2) === './';
    const fullConfigPath: string = isRelativeConfig ? path.resolve(process.cwd(), config) : config;
    webpackConfig = fullConfigPath;
  } else {
    webpackConfig = path.resolve(__dirname, '../../webpack.config.js');
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

  if(outputPathinfo) {
    webpackOptions.push('--output-path-info', outputPathinfo);
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
    const nodePath: string = path.resolve(__dirname, '../../node_modules');
    const webpackPath: string = relativeFilePath('webpack-cli/bin/cli.js', nodePath);
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
