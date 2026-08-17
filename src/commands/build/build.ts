/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {transform} from '@swc/core';
import {execa} from 'execa';
import {existsSync, readFileSync} from 'fs';
import {sync as globSync} from 'glob';
import {build as viteBuild, createServer as createViteServer} from 'vite';
import {
  dirname,
  relative as pathRelative,
  resolve as pathResolve
} from 'path';

import {LexConfig} from '../../LexConfig.js';
import {checkLinkedModules, copyConfiguredFiles, createSpinner, removeFiles} from '../../utils/app.js';
import {
  resolveBinaryPath
} from '../../utils/file.js';
import {log} from '../../utils/log.js';
import {renderStaticSite} from '../../utils/staticSite.js';
import {processTranslations} from '../../utils/translations.js';
import {compressLexWebAssets, copyLexWebAssets, optimizeLexWebAssets} from '../../utils/vite/assets.js';
import {createLexViteConfig} from '../../utils/vite/config.js';
import {aiFunction} from '../ai/ai.js';
import boxen from 'boxen';
import chalk from 'chalk';

import type {SWCOptions} from '../../LexConfig.js';
import type {Spinner} from '../../utils/app.js';

export interface BuildOptions {
  readonly assist?: boolean;
  readonly analyze?: boolean;
  readonly bundler?: 'swc' | 'vite';
  readonly cliName?: string;
  readonly entry?: string | string[];
  readonly format?: string;
  readonly mode?: 'development' | 'production';
  readonly outputPath?: string;
  readonly quiet?: boolean;
  readonly remove?: boolean;
  readonly sourcePath?: string;
  readonly static?: boolean;
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
    `${chalk.cyan.bold('🏗️  Build Completed Successfully ')}\n\n` +
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

export const buildWithSWC = async (spinner: Spinner, commandOptions: BuildOptions, callback: BuildCallback) => {
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
      const swcOptions = {
        ...swcConfig,
        filename: file,
        module: {
          type: format === 'cjs' ? 'commonjs' as const : (swcConfig?.module?.type as 'es6' || 'es6'),
          ...swcConfig?.module
        },
      } as Partial<SWCOptions>;

      const result = await transform(sourceCode, swcOptions);

      const {writeFileSync} = await import('fs');
      writeFileSync(outputPath, result.code);
    });

    await Promise.all(transformPromises);

    spinner.succeed('Build completed with SWC');
    displayBuildStatus('SWC', outputDir, quiet ?? false);
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

export const buildWithVite = async (spinner: Spinner, cmd: BuildOptions, callback: BuildCallback): Promise<number> => {
  const {analyze, assist, entry, mode = 'production', quiet = false, static: isStatic = false} = cmd;
  const entryValue = Array.isArray(entry) ? entry[0] : entry;
  const outputPath = LexConfig.config.outputFullPath || pathResolve(process.cwd(), './lib');

  try {
    spinner.start('Building with Vite...');
    await viteBuild(createLexViteConfig({analyze, command: 'build', entry: entryValue, mode, quiet}));
    await copyLexWebAssets(LexConfig.config);
    await optimizeLexWebAssets(LexConfig.config);

    if(isStatic) {
      const server = await createViteServer({
        ...createLexViteConfig({command: 'serve', entry: entryValue, mode, quiet, ssr: true}),
        server: {middlewareMode: true}
      });
      try {
        const sourcePath = LexConfig.config.sourceFullPath || pathResolve(process.cwd(), './src');
        const entryPath = pathResolve(sourcePath, entryValue || LexConfig.config.entryJs || 'index.js');
        const module = await server.ssrLoadModule(entryPath);
        const render = module.default || module.render;
        if(typeof render !== 'function') throw new Error(`Static entry "${entryPath}" must export a render function.`);

        const assets = globSync('**/*', {cwd: outputPath, nodir: true}).reduce<Record<string, string>>((result, fileName) => {
          result[fileName] = `/${fileName}`;
          return result;
        }, {});
        await renderStaticSite({assets, outputPath, render});
      } finally {
        await server.close();
      }
    }

    compressLexWebAssets(LexConfig.config);
    spinner.succeed('Build completed successfully!');
    displayBuildStatus('Vite', outputPath, quiet);
    callback(0);
    return 0;
  } catch(error) {
    const buildError = error instanceof Error ? error : new Error(String(error));
    log(`\n${cmd.cliName || 'Lex'} Error: Vite build failed`, 'error', quiet);
    log(`\nError: ${buildError.message}`, 'error', quiet);
    spinner.fail('Build failed.');

    if(assist) {
      try {
        await aiFunction({prompt: `Fix this Vite build error: ${buildError.message}\n\n${buildError.stack || ''}`, task: 'help', context: true, quiet});
      } catch(aiError) {
        if(!quiet) console.error('AI assistance error:', aiError);
      }
    }

    callback(1);
    return 1;
  }
};

export const build = async (cmd: BuildOptions, callback: BuildCallback = () => ({})): Promise<number> => {
  const {
    bundler: requestedBundler,
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
  const bundler = requestedBundler || (LexConfig.config.targetEnvironment === 'web' ? 'vite' : 'swc');

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
    buildResult = await buildWithVite(spinner, cmd, (status: number) => {
      buildResult = status;
    });
  }

  if(buildResult === 0 && cmd.analyze) {
    spinner.start('AI is analyzing the build output for optimization opportunities...');

    try {
      const stats = {
        outputPath: LexConfig.config.outputFullPath,
        entryPoints: bundler === 'swc'
          ? `Source files: ${LexConfig.config.sourceFullPath}/**/*.{ts,js}`
          : LexConfig.config.entryJs || 'Unknown entry point'
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
            const tsFiles = globSync(`**/!(*.spec|*.test|*.integration|*.e2e).ts`, globOptions);
            const tsxFiles = globSync(`**/!(*.spec|*.test|*.integration|*.e2e).tsx`, globOptions);
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
