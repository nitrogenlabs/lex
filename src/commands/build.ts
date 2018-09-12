import execa from 'execa';
import * as path from 'path';

import {LexConfig} from '../LexConfig';
import {checkLinkedModules, createSpinner, log, relativeFilePath} from '../utils';
import {removeFiles} from './clean';

export const build = async (cmd) => {
  const {cliName = 'Lex', config, mode, quiet = false, remove, variables} = cmd;

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
      return process.exit(1);
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

  const webpackMode: string = mode || 'production';

  // Compile using webpack
  try {
    const nodePath: string = path.resolve(__dirname, '../../node_modules');
    const webpackPath: string = relativeFilePath('webpack-cli/bin/cli.js', nodePath);
    const webpack = await execa(webpackPath, ['--config', webpackConfig, '--mode', webpackMode], {
      encoding: 'utf-8',
      stdio: 'inherit'
    });

    // Stop spinner
    if(!webpack.status) {
      spinner.succeed('Build completed successfully!');
    } else {
      spinner.fail('Build failed.');
    }

    // Stop process
    return process.exit(webpack.status);
  } catch(error) {
    // Display error message
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    // Stop spinner
    spinner.fail('Build failed.');

    // Kill process
    return process.exit(1);
  }
};
