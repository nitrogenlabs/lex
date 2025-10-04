/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {transform} from '@swc/core';
import {execa} from 'execa';
import {existsSync, lstatSync, readdirSync, readFileSync, writeFileSync, mkdirSync} from 'fs';
import {sync as globSync} from 'glob';
import {extname as pathExtname, join as pathJoin, resolve as pathResolve, dirname} from 'path';

import {LexConfig, getTypeScriptConfigPath} from '../../LexConfig.js';
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
  const dirPath: string = pathResolve(dirName, '../..');

  checkLinkedModules();

  if(remove) {
    await removeFiles(outputDir);
  }

  if(useTypescript) {
    LexConfig.checkCompileTypescriptConfig();

    const typescriptPath: string = resolveBinaryPath('tsc', 'typescript');

    if(!typescriptPath) {
      log(`\n${cliName} Error: TypeScript binary not found in Lex's node_modules or monorepo root`, 'error', quiet);
      log('Please reinstall Lex or check your installation.', 'info', quiet);
      return 1;
    }

    const typescriptOptions: string[] = config ?
      ['-p', config] :
      ['-p', getTypeScriptConfigPath('tsconfig.build.json')];

    spinner.start('Static type checking with Typescript...');

    try {
      await execa(typescriptPath, typescriptOptions, {encoding: 'utf8'});

      spinner.succeed('Successfully completed type checking!');
    } catch(error) {
      log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

      spinner.fail('Type checking failed.');

      callback(1);
      return 1;
    }
  }

  const globOptions = {
    cwd: sourceDir,
    dot: false,
    nodir: true,
    nosort: true
  };
  const tsFiles: string[] = globSync(`${sourceDir}/**/!(*.spec|*.test|*.integration).ts*`, globOptions);
  const jsFiles: string[] = globSync(`${sourceDir}/**/!(*.spec|*.test|*.integration).js`, globOptions);
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

  spinner.start(watch ? 'Watching for changes...' : 'Compiling with SWC...');

  try {
    // Compile each file with SWC
    for(const file of sourceFiles) {
      const sourcePath = pathResolve(sourceDir, file);
      const outputPath = pathResolve(outputDir, file.replace(/\.(ts|tsx)$/, '.js'));

      // Ensure output directory exists
      const outputDirPath = dirname(outputPath);
      if(!existsSync(outputDirPath)) {
        mkdirSync(outputDirPath, {recursive: true});
      }

      const sourceCode = readFileSync(sourcePath, 'utf8');

      const isTSX = file.endsWith('.tsx');

      // Merge SWC config with command-specific overrides
      const swcOptions = {
        filename: file,
        ...swcConfig,
        jsc: {
          ...swcConfig?.jsc,
          parser: {
            decorators: swcConfig?.jsc?.parser?.decorators ?? true,
            dynamicImport: swcConfig?.jsc?.parser?.dynamicImport ?? true,
            syntax: 'typescript' as const,
            tsx: isTSX
          },
          target: swcConfig?.jsc?.target ?? 'es2020',
          transform: isTSX ? {
            ...swcConfig?.jsc?.transform,
            react: {
              runtime: 'automatic' as const,
              ...swcConfig?.jsc?.transform?.react
            }
          } : swcConfig?.jsc?.transform
        },
        module: {
          ...swcConfig?.module,
          type: format === 'cjs' ? 'commonjs' as const : (swcConfig?.module?.type as 'es6' || 'es6')
        }
      };

      const result = await transform(sourceCode, swcOptions);

      writeFileSync(outputPath, result.code);
    }

    spinner.succeed('Compile completed successfully!');
  } catch(error) {
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    if(!quiet) {
      console.error(error);
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