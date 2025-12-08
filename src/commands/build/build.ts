/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {transform} from '@swc/core';
import {execa} from 'execa';
import {existsSync, readFileSync} from 'fs';
import {sync as globSync} from 'glob';
import {
  dirname,
  relative as pathRelative,
  resolve as pathResolve,
  join as pathJoin
} from 'path';

import {LexConfig} from '../../LexConfig.js';
import {checkLinkedModules, copyConfiguredFiles, createSpinner, createProgressBar, handleWebpackProgress, removeFiles} from '../../utils/app.js';
import {
  resolveWebpackPaths,
  getLexPackageJsonPath,
  resolveBinaryPath
} from '../../utils/file.js';
import {log} from '../../utils/log.js';
import {processTranslations} from '../../utils/translations.js';
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
  readonly bundler?: 'webpack' | 'swc';
  readonly cliName?: string;
  readonly entry?: string;
  readonly format?: string;
  readonly outputPath?: string;
  readonly quiet?: boolean;
  readonly remove?: boolean;
  readonly sourcePath?: string;
  readonly test?: boolean;
  readonly translations?: boolean;
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

export const buildWithSWC = async (spinner, commandOptions: BuildOptions, callback: BuildCallback) => {
  const {
    cliName = 'Lex',
    format = 'esm',
    outputPath,
    quiet,
    sourcePath,
    watch
  } = commandOptions;
  const {
    outputFullPath,
    sourceFullPath,
    swc: swcConfig,
    targetEnvironment,
    useGraphQl,
    useTypescript
  } = LexConfig.config;
  const sourceDir: string = sourcePath ? pathResolve(process.cwd(), `./${sourcePath}`) : sourceFullPath || '';

  const globOptions = {
    absolute: true,
    cwd: sourceDir,
    dot: false,
    nodir: true,
    nosort: true
  };
  const tsFiles: string[] = globSync(`**/!(*.spec|*.test).ts*`, globOptions);
  const jsFiles: string[] = globSync(`**/!(*.spec|*.test).js`, globOptions);
  const sourceFiles: string[] = [...tsFiles, ...jsFiles];

  const outputDir: string = outputPath
    ? pathResolve(process.cwd(), outputPath)
    : (outputFullPath || pathResolve(process.cwd(), './lib'));

  try {
    spinner.start('Building with SWC...');

    const transformPromises = sourceFiles.map(async (file) => {
      const fileRelativeToSource = pathRelative(sourceDir, file);
      const sourcePath = file; // file is already absolute
      const outputFile = fileRelativeToSource.replace(/\.(ts|tsx)$/, '.js');
      const outputPath = pathResolve(outputDir, outputFile);
      const outputDirPath = dirname(outputPath);

      if(!existsSync(outputDirPath)) {
        const {mkdirSync} = await import('fs');
        mkdirSync(outputDirPath, {recursive: true});
      }

      const sourceCode = readFileSync(sourcePath, 'utf8');
      const isTSX = file.endsWith('.tsx');
      const swcOptions = {
        filename: file,
        ...swcConfig,
        jsc: {
          ...swcConfig?.jsc,
          parser: {
            comments: false,
            decorators: swcConfig?.jsc?.parser?.decorators ?? true,
            dynamicImport: swcConfig?.jsc?.parser?.dynamicImport ?? true,
            syntax: 'typescript' as const,
            tsx: isTSX
          },
          preserveAllComments: false,
          target: swcConfig?.jsc?.target ?? 'es2020',
          transform: isTSX ? {
            ...swcConfig?.jsc?.transform,
            react: {
              runtime: 'automatic' as const,
              ...swcConfig?.jsc?.transform?.react
            }
          } : swcConfig?.jsc?.transform
        },
        minify: false,
        module: {
          ...swcConfig?.module,
          type: format === 'cjs' ? 'commonjs' as const : (swcConfig?.module?.type as 'es6' || 'es6')
        },
        sourceMaps: swcConfig?.sourceMaps || 'inline'
      };

      const result = await transform(sourceCode, swcOptions);

      const {writeFileSync} = await import('fs');
      writeFileSync(outputPath, result.code);
    });

    await Promise.all(transformPromises);

    spinner.succeed('Build completed with SWC');
    displayBuildStatus('SWC', outputDir, quiet);
    callback(0);
    return 0;
  } catch(error) {
    log(`\n${commandOptions.cliName || 'Lex'} Error: SWC build failed`, 'error', quiet);
    log(`\nError: ${error.message}`, 'error', quiet);

    if(error instanceof Error) {
      if(error.stack) {
        log(`\nStack Trace:\n${error.stack}`, 'error', quiet);
      }

      if('filename' in error || 'file' in error) {
        log(`\nFile: ${(error as any).filename || (error as any).file}`, 'error', quiet);
      }
    }

    spinner.fail('Build failed with SWC');
    if(!quiet) {
      console.error('\nFull Error Details:', error);
    }
    callback(1);
    return 1;
  }
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

  console.log('entry:', entry, 'type:', typeof entry);
  console.log('outputPath:', outputPath, 'type:', typeof outputPath);

  const entryValue = Array.isArray(entry) ? entry[0] : entry;

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

  console.log('webpackConfig path:', webpackConfig);
  console.log('webpackConfig exists:', existsSync(webpackConfig));

  if(!existsSync(webpackConfig)) {
    const lexPackagePath = getLexPackageJsonPath();
    const lexPackageDir = dirname(lexPackagePath);
    const lexWebpackConfig = pathResolve(lexPackageDir, 'webpack.config.js');

    if(existsSync(lexWebpackConfig)) {
      webpackConfig = lexWebpackConfig;
      console.log('Using Lex webpack config:', webpackConfig);
    } else {
      log(`\n${cliName} Error: Could not find webpack.config.js`, 'error', quiet);
      spinner.fail('Build failed.');
      callback(1);
      return 1;
    }
  }

  const webpackOptions: string[] = [
    '--color',
    '--progress',
    '--config', webpackConfig
  ];

  if(analyze) webpackOptions.push('--analyze');
  if(configName) webpackOptions.push('--configName', configName);
  if(defineProcessEnvNodeEnv) webpackOptions.push('--defineProcessEnvNodeEnv', defineProcessEnvNodeEnv);
  if(devtool) webpackOptions.push('--devtool', devtool);
  if(disableInterpret) webpackOptions.push('--disableInterpret');
  if(entryValue) webpackOptions.push('--entry', entryValue.toString());
  if(env) webpackOptions.push('--env', env);
  if(failOnWarnings) webpackOptions.push('--failOnWarnings');
  if(json) webpackOptions.push('--json', json);
  if(mode) webpackOptions.push('--mode', mode);
  if(merge) webpackOptions.push('--merge');
  if(name) webpackOptions.push('--name', name);
  if(noDevtool) webpackOptions.push('--noDevtool');
  if(noStats) webpackOptions.push('--noStats');
  if(noTarget) webpackOptions.push('--noTarget');
  if(noWatch) webpackOptions.push('--noWatch');
  if(noWatchOptionsStdin) webpackOptions.push('--noWatchOptionsStdin');
  if(nodeEnv) webpackOptions.push('--nodeEnv', nodeEnv);
  if(outputPath) webpackOptions.push('--output-path', outputPath.toString()); // Convert to string
  if(stats) webpackOptions.push('--stats', stats);
  if(target) webpackOptions.push('--target', target);
  if(watch) webpackOptions.push('--watch');
  if(watchOptionsStdin) webpackOptions.push('--watchOptionsStdin');

  try {
    const {webpackPath} = resolveWebpackPaths(currentDirname);

    let executablePath = webpackPath;
    let finalWebpackOptions: string[];

    if(webpackPath === 'npx') {
      finalWebpackOptions = ['webpack', ...webpackOptions];
    } else if(webpackPath.endsWith('.js')) {
      executablePath = 'node';
      finalWebpackOptions = [webpackPath, ...webpackOptions];
    } else {
      finalWebpackOptions = [...webpackOptions];
    }

    console.log('webpackPath:', webpackPath);
    console.log('executablePath:', executablePath);
    console.log('finalWebpackOptions:', JSON.stringify(finalWebpackOptions));
    console.log('finalWebpackOptions type:', Array.isArray(finalWebpackOptions) ? 'Array' : typeof finalWebpackOptions);

    const childProcess = execa(executablePath, finalWebpackOptions, {encoding: 'utf8', stdio: 'pipe'});

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

        displayBuildStatus('webpack', LexConfig.config.outputFullPath || 'lib', quiet, buildStats);
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

        displayBuildStatus('webpack', LexConfig.config.outputFullPath || 'lib', quiet, buildStats);
      }
    });

    await childProcess;

    if(!buildCompleted) {
      spinner.succeed('Build completed successfully!');
      displayBuildStatus('webpack', LexConfig.config.outputFullPath || 'lib', quiet, buildStats);
    }

    callback(0);
    return 0;
  } catch(error) {
    log(`\n${cliName} Error: Webpack build failed`, 'error', quiet);
    log(`\nError: ${error.message}`, 'error', quiet);

    if(error instanceof Error) {
      if(error.stack) {
        log(`\nStack Trace:\n${error.stack}`, 'error', quiet);
      }
    }

    log(`\nWebpack Options: ${webpackOptions.slice(0, 5).join(' ')}...`, 'error', quiet);

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

    if(!quiet) {
      console.error('\nFull Error Details:', error);
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
    test = false,
    translations = false,
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

  if(test) {
    log('Test mode: Build environment loaded, exiting', 'info', quiet);
    callback(0);
    return 0;
  }

  if(translations) {
    spinner.start('Processing translations...');

    try {
      const sourcePath = LexConfig.config.sourceFullPath || process.cwd();
      const outputPath = LexConfig.config.outputFullPath || 'lib';

      await processTranslations(sourcePath, outputPath, quiet);
      spinner.succeed('Translations processed successfully!');
    } catch(translationError) {
      log(`\n${cliName} Error: Failed to process translations: ${translationError.message}`, 'error', quiet);
      spinner.fail('Failed to process translations.');
      callback(1);
      return 1;
    }
  }

  spinner.start('Building code...');

  if(remove) {
    await removeFiles(outputFullPath || '');
  }

  let buildResult = 0;

  if(bundler === 'swc') {
    buildResult = await buildWithSWC(spinner, cmd, (status) => {
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
        entryPoints: bundler === 'swc' ?
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
      if(useTypescript && bundler === 'swc') {
        const typescriptPath = resolveBinaryPath('tsc', 'typescript');

        if(typescriptPath) {
          spinner.start('Generating TypeScript declarations...');
          try {
            const sourceFullPath = LexConfig.config.sourceFullPath || pathResolve(process.cwd(), './src');
            const outputFullPath = LexConfig.config.outputFullPath || pathResolve(process.cwd(), './lib');
            const globOptions = {
              cwd: sourceFullPath,
              dot: false,
              nodir: true,
              absolute: true
            };
            const tsFiles = globSync(`**/!(*.spec|*.test|*.integration).ts`, globOptions);
            const tsxFiles = globSync(`**/!(*.spec|*.test|*.integration).tsx`, globOptions);
            const allSourceFiles = [...tsFiles, ...tsxFiles];
            const typescriptOptions = [
              ...LexConfig.getTypeScriptDeclarationFlags(),
              ...allSourceFiles
            ];
            const result = await execa(typescriptPath, typescriptOptions, {
              encoding: 'utf8',
              cwd: process.cwd(),
              reject: false,
              all: true
            });

            if(result.exitCode !== 0) {
              // TypeScript may have errors but still generate some declarations
              // Log warnings but don't fail if declarations were generated
              const hasDeclarations = result.all?.includes('Writing') || result.all?.includes('Declaration') || false;
              const errorOutput = result.stderr || result.stdout || result.all || 'Unknown error';

              if(!hasDeclarations) {
                log(`\n${cliName} Error: TypeScript declaration generation failed`, 'error', quiet);
                log(`\nExit Code: ${result.exitCode}`, 'error', quiet);
                log(`\nTypeScript Command: ${typescriptPath} ${typescriptOptions.slice(0, 10).join(' ')}...`, 'error', quiet);
                log(`\nError Output:\n${errorOutput}`, 'error', quiet);

                const errorLines = errorOutput.split('\n').filter(line =>
                  line.includes('error TS') ||
                  line.includes('Error:') ||
                  line.trim().startsWith('src/') ||
                  line.trim().startsWith('TS')
                );

                if(errorLines.length > 0) {
                  log(`\nKey Errors:`, 'error', quiet);
                  errorLines.slice(0, 10).forEach(line => {
                    log(`  ${line}`, 'error', quiet);
                  });
                  if(errorLines.length > 10) {
                    log(`  ... and ${errorLines.length - 10} more errors`, 'error', quiet);
                  }
                }

                spinner.fail('TypeScript declaration generation had errors (continuing anyway).');
              } else {
                log(`\n${cliName} Warning: TypeScript declaration generation completed with errors`, 'warn', quiet);
                if(!quiet && errorOutput) {
                  log(`\nWarnings:\n${errorOutput}`, 'warn', quiet);
                }
                spinner.succeed('TypeScript declarations generated (with warnings).');
              }
            } else {
              spinner.succeed('TypeScript declarations generated!');
            }
          } catch(error) {
            log(`\n${cliName} Error: TypeScript declaration generation exception`, 'error', quiet);
            log(`\nError: ${error.message}`, 'error', quiet);
            if(error instanceof Error && error.stack) {
              log(`\nStack:\n${error.stack}`, 'error', quiet);
            }
            spinner.fail('TypeScript declaration generation had issues (continuing anyway).');
          }
        }
      }

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
