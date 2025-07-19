/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import GraphqlLoaderPlugin from '@luckycatfactory/esbuild-graphql-loader';
import {execa} from 'execa';
import {existsSync, readFileSync} from 'fs';
import {sync as globSync} from 'glob';
import {dirname, resolve as pathResolve} from 'path';

import {LexConfig, getTypeScriptConfigPath} from '../../LexConfig.js';
import {checkLinkedModules, copyConfiguredFiles, createSpinner, createProgressBar, handleWebpackProgress, removeFiles} from '../../utils/app.js';
import {getDirName, relativeNodePath, resolveWebpackPaths} from '../../utils/file.js';
import {log} from '../../utils/log.js';
import {aiFunction} from '../ai/ai.js';
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

export interface BuildOptions {
  readonly assist?: boolean;
  readonly analyze?: boolean;
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

const displayBuildStatus = (bundler: string, outputPath: string, quiet: boolean, stats?: {modules?: number; assets?: number; size?: string}) => {
  if(quiet) return;

  let statsInfo = '';
  if(stats && stats.modules && stats.assets) {
    statsInfo = `\n${chalk.green('Modules:')}    ${chalk.cyan(stats.modules)}\n` +
      `${chalk.green('Assets:')}     ${chalk.cyan(stats.assets)}\n` +
      `${chalk.green('Size:')}       ${chalk.cyan(stats.size)}\n`;
  }

  const statusBox = boxen(
    `${chalk.cyan.bold('🏗️  Build Completed Successfully')}\n\n` +
    `${chalk.green('Bundler:')}    ${chalk.cyan(bundler)}\n` +
    `${chalk.green('Output:')}     ${chalk.underline(outputPath)}${statsInfo}\n` +
    `${chalk.yellow('Ready for deployment! 🚀')}`,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'green',
      backgroundColor: '#1a1a1a'
    }
  );

  console.log('\n' + statusBox + '\n');
};

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
  const sourceDir: string = sourcePath ? pathResolve(process.cwd(), `./${sourcePath}`) : sourceFullPath || '';
  const loader = {
    '.js': 'js'
  };

  if(useTypescript) {
    loader['.ts'] = 'ts';
    loader['.tsx'] = 'tsx';
  }

  const plugins = [];

  if(useGraphQl) {
    plugins.push((GraphqlLoaderPlugin as unknown as () => never)());
  }

  const globOptions = {
    cwd: sourceDir,
    dot: false,
    nodir: true,
    nosort: true
  };
  const tsFiles: string[] = globSync(`${sourceDir}/**/!(*.spec|*.test).ts*`, globOptions);
  const jsFiles: string[] = globSync(`${sourceDir}/**/!(*.spec|*.test).js`, globOptions);
  const sourceFiles: string[] = [...tsFiles, ...jsFiles];

  const packageJsonData = readFileSync(pathResolve(process.cwd(), './package.json'));
  const packageJson = JSON.parse(packageJsonData.toString());
  const external = [
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.peerDependencies || {})
  ];

  const dirName = getDirName();
  const dirPath: string = pathResolve(dirName, '../..');
  const outputDir: string = outputPath || outputFullPath || '';
  const esbuildPath: string = relativeNodePath('esbuild/bin/esbuild', dirPath);
  const esbuildConfig = LexConfig.config.esbuild || {};

  const esbuildOptions: string[] = [
    ...sourceFiles,
    '--bundle',
    '--color=true',
    `--format=${format}`,
    `--outdir=${outputDir}`,
    `--platform=${esbuildConfig.platform || 'node'}`,
    `--target=${esbuildConfig.target || (targetEnvironment === 'node' ? 'node20' : 'es2020')}`,
    `--sourcemap=${esbuildConfig.sourcemap || 'inline'}`
  ];

  if(esbuildConfig.minify !== false) {
    esbuildOptions.push('--minify');
  }

  if(esbuildConfig.treeShaking !== false) {
    esbuildOptions.push('--tree-shaking=true');
  }

  if(esbuildConfig.drop && esbuildConfig.drop.length > 0) {
    esbuildConfig.drop.forEach(item => {
      esbuildOptions.push(`--drop:${item}`);
    });
  }

  if(esbuildConfig.pure && esbuildConfig.pure.length > 0) {
    esbuildConfig.pure.forEach(item => {
      esbuildOptions.push(`--pure:${item}`);
    });
  }

  if(esbuildConfig.legalComments) {
    esbuildOptions.push(`--legal-comments=${esbuildConfig.legalComments}`);
  }

  if(esbuildConfig.splitting !== false) {
    esbuildOptions.push('--splitting');
  }

  if(esbuildConfig.metafile) {
    esbuildOptions.push('--metafile');
  }

  if(esbuildConfig.banner) {
    Object.entries(esbuildConfig.banner).forEach(([type, content]) => {
      esbuildOptions.push(`--banner:${type}=${content}`);
    });
  }

  if(esbuildConfig.footer) {
    Object.entries(esbuildConfig.footer).forEach(([type, content]) => {
      esbuildOptions.push(`--footer:${type}=${content}`);
    });
  }

  if(esbuildConfig.define) {
    Object.entries(esbuildConfig.define).forEach(([key, value]) => {
      esbuildOptions.push(`--define:${key}=${value}`);
    });
  }

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
    displayBuildStatus('esbuild', outputDir, quiet);
  } catch(error) {
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    if(!quiet) {
      console.error(error);
    }

    spinner.fail('Code build failed.');

    if(commandOptions.assist) {
      spinner.start('AI is analyzing the error...');

      try {
        await aiFunction({
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

  let webpackConfig: string;

  if(config) {
    const isRelativeConfig: boolean = config.substr(0, 2) === './';
    webpackConfig = isRelativeConfig ? pathResolve(process.cwd(), config) : config;
  } else {
    const projectConfigPath = pathResolve(process.cwd(), 'webpack.config.js');
    const projectConfigPathTs = pathResolve(process.cwd(), 'webpack.config.ts');
    const hasProjectConfig = existsSync(projectConfigPath) || existsSync(projectConfigPathTs);

    if(hasProjectConfig) {
      webpackConfig = existsSync(projectConfigPathTs) ? projectConfigPathTs : projectConfigPath;
    } else {
      const {webpackConfig: resolvedConfig} = resolveWebpackPaths(currentDirname);
      webpackConfig = resolvedConfig;
    }
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

  try {
    const {webpackPath} = resolveWebpackPaths(currentDirname);

    const finalWebpackOptions = webpackPath === 'npx' ? ['webpack', ...webpackOptions] : webpackOptions;

    const childProcess = execa(webpackPath, finalWebpackOptions, {encoding: 'utf8', stdio: 'pipe'});

    let buildCompleted = false;
    let buildStats = {
      modules: 0,
      assets: 0,
      size: '0 B'
    };

    childProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();

      handleWebpackProgress(output, spinner, quiet, '🏗️', 'Webpack Building');

      if(!buildCompleted && output.includes('compiled successfully')) {
        buildCompleted = true;
        spinner.succeed('Build completed successfully!');

        const moduleMatch = output.match(/(\d+) modules/);
        const assetMatch = output.match(/(\d+) assets/);
        const sizeMatch = output.match(/assets by status ([\d.]+ \w+)/) || output.match(/assets by path.*?([\d.]+ \w+)/);

        if(moduleMatch) buildStats.modules = parseInt(moduleMatch[1], 10);
        if(assetMatch) buildStats.assets = parseInt(assetMatch[1], 10);
        if(sizeMatch) buildStats.size = sizeMatch[1];

        displayBuildStatus('webpack', LexConfig.config.outputFullPath || 'dist', quiet, buildStats);
      }
    });

    childProcess.stderr?.on('data', (data: Buffer) => {
      const output = data.toString();

      handleWebpackProgress(output, spinner, quiet, '🏗️', 'Webpack Building');

      if(!buildCompleted && output.includes('compiled successfully')) {
        buildCompleted = true;
        spinner.succeed('Build completed successfully!');

        const moduleMatch = output.match(/(\d+) modules/);
        const assetMatch = output.match(/(\d+) assets/);
        const sizeMatch = output.match(/assets by status ([\d.]+ \w+)/) || output.match(/assets by path.*?([\d.]+ \w+)/);

        if(moduleMatch) buildStats.modules = parseInt(moduleMatch[1], 10);
        if(assetMatch) buildStats.assets = parseInt(assetMatch[1], 10);
        if(sizeMatch) buildStats.size = sizeMatch[1];

        displayBuildStatus('webpack', LexConfig.config.outputFullPath || 'dist', quiet, buildStats);
      }
    });

    await childProcess;

    if(!buildCompleted) {
      spinner.succeed('Build completed successfully!');
      displayBuildStatus('webpack', LexConfig.config.outputFullPath || 'dist', quiet, buildStats);
    }

    callback(0);
    return 0;
  } catch(error) {
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    spinner.fail('Build failed.');

    if(cmd.assist) {
      spinner.start('AI is analyzing the webpack error...');

      try {
        await aiFunction({
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

  const spinner = createSpinner(quiet);

  log(`${cliName} building...`, 'info', quiet);

  await LexConfig.parseConfig(cmd);

  const {outputFullPath, useTypescript} = LexConfig.config;

  checkLinkedModules();

  let variablesObj: object = {NODE_ENV: 'production'};

  if(variables) {
    try {
      variablesObj = JSON.parse(variables);
    } catch(error) {
      log(`\n${cliName} Error: Environment variables option is not a valid JSON object.`, 'error', quiet);

      callback(1);
      return 1;
    }
  }

  process.env = {...process.env, ...variablesObj};

  spinner.start('Building code...');

  if(remove) {
    await removeFiles(outputFullPath || '');
  }

  if(useTypescript) {
    const compileConfigPath = getTypeScriptConfigPath('tsconfig.build.json');
    if(existsSync(compileConfigPath)) {
      log('Using tsconfig.build.json for build...', 'info', quiet);
    } else {
      LexConfig.checkCompileTypescriptConfig();
    }
  }

  let buildResult = 0;

  if(bundler === 'esbuild') {
    buildResult = await buildWithEsBuild(spinner, cmd, (status) => {
      buildResult = status;
    });
  } else {
    buildResult = await buildWithWebpack(spinner, cmd, (status) => {
      buildResult = status;
    });
  }

  if(buildResult === 0 && cmd.analyze) {
    spinner.start('AI is analyzing the build output for optimization opportunities...');

    try {
      const stats = {
        outputPath: LexConfig.config.outputFullPath,
        entryPoints: bundler === 'esbuild' ?
          `Source files: ${LexConfig.config.sourceFullPath}/**/*.{ts,js}` :
          LexConfig.config.webpack?.entry || 'Unknown entry points'
      };

      await aiFunction({
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

  if(buildResult === 0) {
    try {
      await copyConfiguredFiles(spinner, LexConfig.config, quiet);
    } catch(copyError) {
      log(`\n${cliName} Error: Failed to copy configured files: ${copyError.message}`, 'error', quiet);
      callback(1);
      return 1;
    }
  }

  callback(buildResult);
  return buildResult;
};

export default build;
