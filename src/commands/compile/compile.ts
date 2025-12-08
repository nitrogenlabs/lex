/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {transform} from '@swc/core';
import {execa} from 'execa';
import {existsSync, lstatSync, readdirSync, readFileSync, writeFileSync, mkdirSync} from 'fs';
import {sync as globSync} from 'glob';
import {extname as pathExtname, join as pathJoin, relative as pathRelative, resolve as pathResolve, dirname} from 'path';

import {LexConfig} from '../../LexConfig.js';
import {checkLinkedModules, copyConfiguredFiles, copyFiles, createSpinner, getFilesByExt, removeFiles} from '../../utils/app.js';
import {getDirName, resolveBinaryPath} from '../../utils/file.js';
import {log} from '../../utils/log.js';

export const hasFileType = (startPath: string, ext: string[]): boolean => {
  if(!existsSync(startPath)) {
    return false;
  }

  const files: string[] = readdirSync(startPath);

  return files.some((file: string) => {
    const filename: string = pathJoin(startPath, file);
    const fileExt: string = pathExtname(filename);
    const stat = lstatSync(filename);

    if(stat.isDirectory()) {
      return hasFileType(filename, ext);
    }

    return ext.includes(fileExt);
  });
};

export const compile = async (cmd: any, callback: any = () => ({})): Promise<number> => {
  const {
    cliName = 'Lex',
    config,
    format = 'esm',
    outputPath,
    quiet,
    remove,
    sourcePath,
    watch
  } = cmd;

  const spinner = createSpinner(quiet);

  log(`${cliName} compiling...`, 'info', quiet);

  await LexConfig.parseConfig(cmd);

  const {outputFullPath, sourceFullPath, swc: swcConfig, useTypescript} = LexConfig.config;
  const outputDir: string = outputPath || outputFullPath;
  const sourceDir: string = sourcePath ? pathResolve(process.cwd(), `./${sourcePath}`) : sourceFullPath || '';
  const dirName = getDirName();

  checkLinkedModules();

  if(remove) {
    await removeFiles(outputDir);
  }

  if(useTypescript) {
    const typescriptPath: string = resolveBinaryPath('tsc', 'typescript');

    if(!typescriptPath) {
      log(`\n${cliName} Error: TypeScript binary not found in Lex's node_modules or monorepo root`, 'error', quiet);
      log('Please reinstall Lex or check your installation.', 'info', quiet);
      return 1;
    }

    const typescriptOptions: string[] = config
      ? ['-p', config, '--emitDeclarationOnly', '--skipLibCheck'] // User provided custom config, but still only emit declarations
      : (() => {
        const globOptions = {
          absolute: true,
          cwd: sourceDir,
          dot: false,
          nodir: true
        };
        const tsFiles = globSync('**/!(*.spec|*.test|*.integration).ts', globOptions);
        const tsxFiles = globSync('**/!(*.spec|*.test|*.integration).tsx', globOptions);
        const allSourceFiles = [...tsFiles, ...tsxFiles];

        return [
          ...LexConfig.getTypeScriptDeclarationFlags(),
          ...allSourceFiles
        ];
      })();

    spinner.start('Generating TypeScript declarations...');

    try {
      const result = await execa(typescriptPath, typescriptOptions, {
        all: true,
        cwd: process.cwd(),
        encoding: 'utf8',
        reject: false
      });

      if(result.exitCode !== 0) {
        const hasDeclarations = result.all?.includes('Writing') || result.all?.includes('Declaration') || false;
        const errorOutput = result.stderr || result.stdout || result.all || 'Unknown error';

        if(!hasDeclarations) {
          log(`\n${cliName} Error: TypeScript declaration generation failed`, 'error', quiet);
          log(`\nExit Code: ${result.exitCode}`, 'error', quiet);
          log(`\nTypeScript Command: ${typescriptPath} ${typescriptOptions.join(' ')}`, 'error', quiet);
          log(`\nError Output:\n${errorOutput}`, 'error', quiet);

          const errorLines = errorOutput.split('\n').filter((line) =>
            line.includes('error TS') ||
            line.includes('Error:') ||
            line.trim().startsWith('src/') ||
            line.trim().startsWith('TS')
          );

          if(errorLines.length > 0) {
            log('\nKey Errors:', 'error', quiet);

            errorLines.slice(0, 10).forEach((line) => {
              log(`  ${line}`, 'error', quiet);
            });

            if(errorLines.length > 10) {
              log(`  ... and ${errorLines.length - 10} more errors`, 'error', quiet);
            }
          }

          spinner.fail('TypeScript declaration generation failed.');
        } else {
          log(`\n${cliName} Warning: TypeScript declaration generation completed with errors`, 'warn', quiet);

          if(!quiet && errorOutput) {
            log(`\nWarnings:\n${errorOutput}`, 'warn', quiet);
          }

          spinner.succeed('TypeScript declarations generated (with warnings).');
        }
      } else {
        spinner.succeed('Successfully generated TypeScript declarations!');
      }
    } catch(error) {
      log(`\n${cliName} Error: TypeScript declaration generation exception`, 'error', quiet);
      log(`\nError: ${error.message}`, 'error', quiet);

      if(error instanceof Error && error.stack) {
        log(`\nStack:\n${error.stack}`, 'error', quiet);
      }

      spinner.fail('TypeScript declaration generation had issues, continuing...');
    }
  }

  const globOptions = {
    absolute: true,
    cwd: sourceDir,
    dot: false,
    nodir: true,
    nosort: true
  };
  const tsFiles: string[] = globSync('**/!(*.spec|*.test|*.integration).ts*', globOptions);
  const jsFiles: string[] = globSync('**/!(*.spec|*.test|*.integration).js', globOptions);
  const sourceFiles: string[] = [...tsFiles, ...jsFiles];

  const cssFiles: string[] = getFilesByExt('.css', LexConfig.config);

  if(cssFiles.length) {
    const postcssPath: string = resolveBinaryPath('postcss', 'postcss-cli');

    if(!postcssPath) {
      log(`\n${cliName} Error: PostCSS binary not found in Lex's node_modules or monorepo root`, 'error', quiet);
      log('Please reinstall Lex or check your installation.', 'info', quiet);
      return 1;
    }

    const postcssOptions: string[] = [
      `${sourceDir}/**/**.css`,
      '--base',
      sourceDir,
      '--dir',
      outputDir,
      '--config',
      pathResolve(dirName, '../../postcss.config.js')
    ];

    try {
      await execa(postcssPath, postcssOptions, {encoding: 'utf8'});
      spinner.succeed(`Successfully formatted ${cssFiles.length} css files!`);
    } catch(error) {
      log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

      spinner.fail('Failed formatting css.');

      callback(1);
      return 1;
    }
  }

  const gifFiles: string[] = getFilesByExt('.gif', LexConfig.config);
  const jpgFiles: string[] = getFilesByExt('.jpg', LexConfig.config);
  const pngFiles: string[] = getFilesByExt('.png', LexConfig.config);
  const svgFiles: string[] = getFilesByExt('.svg', LexConfig.config);
  const imageFiles: string[] = [...gifFiles, ...jpgFiles, ...pngFiles, ...svgFiles];

  if(imageFiles.length) {
    try {
      await copyFiles(imageFiles, 'image', spinner, LexConfig.config);
    } catch(error) {
      log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

      spinner.fail('Failed to move images to output directory.');

      callback(1);
      return 1;
    }
  }

  const ttfFiles: string[] = getFilesByExt('.ttf', LexConfig.config);
  const otfFiles: string[] = getFilesByExt('.otf', LexConfig.config);
  const woffFiles: string[] = getFilesByExt('.woff', LexConfig.config);
  const woff2Files: string[] = getFilesByExt('.woff2', LexConfig.config);
  const fontFiles: string[] = [...ttfFiles, ...otfFiles, ...woffFiles, ...woff2Files];

  if(fontFiles.length) {
    try {
      await copyFiles(fontFiles, 'font', spinner, LexConfig.config);
    } catch(error) {
      log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

      spinner.fail('Failed to move fonts to output directory.');

      callback(1);
      return 1;
    }
  }

  const mdFiles: string[] = getFilesByExt('.md', LexConfig.config);

  if(mdFiles.length) {
    try {
      await copyFiles(mdFiles, 'documents', spinner, LexConfig.config);
    } catch(error) {
      log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

      spinner.fail('Failed to move docs to output directory.');

      callback(1);
      return 1;
    }
  }

  if(sourceFiles.length === 0) {
    log(`\n${cliName} Warning: No source files found to compile in ${sourceDir}`, 'warn', quiet);
    spinner.succeed('No files to compile.');
    callback(0);
    return 0;
  }

  spinner.start(watch ? 'Watching for changes...' : 'Compiling with SWC...');

  try {
    for(const file of sourceFiles) {
      const fileRelativeToSource = pathRelative(sourceDir, pathResolve(sourceDir, file));
      const sourcePath = pathResolve(sourceDir, fileRelativeToSource);
      const outputFile = fileRelativeToSource.replace(/\.(ts|tsx)$/, '.js');
      const outputPath = pathResolve(outputDir, outputFile);
      const outputDirPath = dirname(outputPath);

      if(!existsSync(outputDirPath)) {
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

      writeFileSync(outputPath, result.code);
    }

    spinner.succeed('Compile completed successfully!');
  } catch(error) {
    log(`\n${cliName} Error: SWC compilation failed`, 'error', quiet);
    log(`\nError: ${error.message}`, 'error', quiet);

    if(error instanceof Error) {
      if(error.stack) {
        log(`\nStack Trace:\n${error.stack}`, 'error', quiet);
      }

      if('filename' in error || 'file' in error) {
        log(`\nFile: ${(error as any).filename || (error as any).file}`, 'error', quiet);
      }
    }

    if(!quiet) {
      console.error('\nFull Error Details:', error);
    }

    spinner.fail('Code compiling failed.');

    callback(1);
    return 1;
  }

  try {
    await copyConfiguredFiles(spinner, LexConfig.config, quiet);
  } catch(copyError) {
    log(`\n${cliName} Error: Failed to copy configured files: ${copyError.message}`, 'error', quiet);

    spinner.fail('Failed to copy configured files.');

    callback(1);
    return 1;
  }

  callback(0);
  return 0;
};