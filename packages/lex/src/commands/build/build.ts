/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import GraphqlLoaderPlugin from '@luckycatfactory/esbuild-graphql-loader';
import {execa} from 'execa';
import {readFileSync} from 'fs';
import {sync as globSync} from 'glob';
import {resolve as pathResolve} from 'path';
import {URL} from 'url';

import {LexConfig} from '../../LexConfig.js';
import {checkLinkedModules, createSpinner, removeFiles} from '../../utils/app.js';
import {relativeNodePath} from '../../utils/file.js';
import {log} from '../../utils/log.js';
import ai from '../ai/ai.js';

export interface BuildOptions {
  readonly assist?: boolean; // Enable AI assistance for error resolution
  readonly analyze?: boolean; // Enable AI analysis for build optimization
  readonly bundler?: 'webpack' | 'esbuild';
  readonly cliName?: string;
  readonly format?: string;
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
    format = 'cjs',
    outputPath,
    quiet,
    sourcePath,
    watch
  } = commandOptions;
  const {
    outputFullPath,
    sourceFullPath,
    targetEnvironment,
    useGraphQl,
    useTypescript
  } = LexConfig.config;
  const sourceDir: string = sourcePath ? pathResolve(process.cwd(), `./${sourcePath}`) : sourceFullPath;
  const loader = {
    '.js': 'js'
  };

  if(useTypescript) {
    loader['.ts'] = 'ts';
    loader['.tsx'] = 'tsx';
  }

  const plugins = [];

  if(useGraphQl) {
    plugins.push((GraphqlLoaderPlugin as unknown as () => void)());
  }

  // Source files
  const globOptions = {
    cwd: sourceDir,
    dot: false,
    nodir: true,
    nosort: true
  };
  const tsFiles: string[] = globSync(`${sourceDir}/**/!(*.spec|*.test).ts*`, globOptions);
  const jsFiles: string[] = globSync(`${sourceDir}/**/!(*.spec|*.test).js`, globOptions);
  const sourceFiles: string[] = [...tsFiles, ...jsFiles];

  // NPM Packages
  const packageJsonData = readFileSync(pathResolve(process.cwd(), './package.json'));
  const packageJson = JSON.parse(packageJsonData.toString());
  const external = [
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.peerDependencies || {})
  ];

  // ESBuild options
  const dirName = new URL('.', import.meta.url).pathname;
  const dirPath: string = pathResolve(dirName, '../..');
  const outputDir: string = outputPath || outputFullPath;
  const esbuildPath: string = relativeNodePath('esbuild/bin/esbuild', dirPath);
  const esbuildOptions: string[] = [
    ...sourceFiles,
    '--bundle',
    '--color=true',
    `--format=${format}`,
    `--outdir=${outputDir}`,
    '--platform=node',
    '--format=cjs',
    '--sourcemap=inline',
    `--target=${targetEnvironment === 'node' ? 'node20' : 'es2018'}`
  ];

  if(external.length) {
    esbuildOptions.push(`--external:${external.join(',')}`);
  }

  if(plugins.length) {
    esbuildOptions.push(`--plugins=${plugins.join(',')}`);
  }
  if(watch) {
    esbuildOptions.push('--watch');
  }

  try {
    await execa(esbuildPath, esbuildOptions, {encoding: 'utf8'});

    spinner.succeed('Build completed successfully!');
  } catch(error) {
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    if(!quiet) {
      console.error(error);
    }

    spinner.fail('Code build failed.');

    // Provide AI assistance if enabled
    if(commandOptions.assist) {
      spinner.start('AI is analyzing the error...');

      try {
        // Use our AI command to analyze the error
        await ai({
          prompt: `Fix this esbuild error: ${error.message}\n\nError details:\n${error.toString()}`,
          task: 'help',
          context: true,
          quiet
        });

        spinner.succeed('AI analysis complete');
      } catch(aiError) {
        spinner.fail('Could not generate AI assistance');
        if(!quiet) {
          console.error('AI assistance error:', aiError);
        }
      }
    }

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

    // Provide AI assistance if enabled
    if(cmd.assist) {
      spinner.start('AI is analyzing the webpack error...');

      try {
        // Use our AI command to analyze the error
        await ai({
          prompt: `Fix this webpack build error: ${error.message}\n\nError details:\n${error.toString()}\n\nConfiguration used:\n${JSON.stringify(webpackOptions, null, 2)}`,
          task: 'help',
          context: true,
          quiet
        });

        spinner.succeed('AI analysis complete');
      } catch(aiError) {
        spinner.fail('Could not generate AI assistance');
        if(!quiet) {
          console.error('AI assistance error:', aiError);
        }
      }
    }

    // Kill process
    callback(1);
    return 1;
  }
};

export const build = async (cmd: BuildOptions, callback: BuildCallback = () => ({})): Promise<number> => {
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

  let buildResult = 0;

  if(bundler === 'esbuild') {
    buildResult = await buildWithEsBuild(spinner, cmd, (status) => {
      // Store the status but don't call the callback yet
      buildResult = status;
    });
  } else {
    buildResult = await buildWithWebpack(spinner, cmd, (status) => {
      // Store the status but don't call the callback yet
      buildResult = status;
    });
  }

  // If build was successful and optimization analysis is requested
  if(buildResult === 0 && cmd.analyze) {
    spinner.start('AI is analyzing the build output for optimization opportunities...');

    try {
      // Get bundle stats or build info for analysis
      const stats = {
        outputPath: LexConfig.config.outputFullPath,
        entryPoints: bundler === 'esbuild' ?
          `Source files: ${LexConfig.config.sourceFullPath}/**/*.{ts,js}` :
          LexConfig.config.webpack?.entry || 'Unknown entry points'
      };

      // Use our AI command to analyze the build
      await ai({
        prompt: `Analyze this build for optimization opportunities:
          
Build Type: ${bundler}
Format: ${cmd.format || 'default'}
Environment: ${LexConfig.config.targetEnvironment}
${JSON.stringify(stats, null, 2)}
          
What are the key optimization opportunities for this build configuration? Consider:
1. Bundle size optimization strategies
2. Code splitting recommendations
3. Tree-shaking improvements
4. Performance enhancements
5. Dependency optimizations`,
        task: 'optimize',
        context: true,
        quiet
      });

      spinner.succeed('AI build analysis complete');
    } catch(aiError) {
      spinner.fail('Could not generate AI optimization analysis');
      if(!quiet) {
        console.error('AI analysis error:', aiError);
      }
    }
  }

  // Now call the original callback with the build result
  callback(buildResult);
  return buildResult;
};

export default build;
