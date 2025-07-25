/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import {existsSync, lstatSync, readdirSync} from 'fs';
import {sync as globSync} from 'glob';
import {extname as pathExtname, join as pathJoin, resolve as pathResolve} from 'path';

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
      // Recursive search
      return hasFileType(filename, ext);
    }

    return ext.includes(fileExt);
  });
};

export const compile = async (cmd: any, callback: any = () => ({})): Promise<number> => {
  const {
    cliName = 'Lex',
    config,
    outputPath,
    quiet,
    remove,
    sourcePath,
    watch
  } = cmd;

  // Spinner
  const spinner = createSpinner(quiet);

  // Display status
  log(`${cliName} compiling...`, 'info', quiet);

  // Get custom configuration
  await LexConfig.parseConfig(cmd);

  // Compile type
  const {outputFullPath, sourceFullPath, useTypescript} = LexConfig.config;
  const outputDir: string = outputPath || outputFullPath;
  const sourceDir: string = sourcePath ? pathResolve(process.cwd(), `./${sourcePath}`) : sourceFullPath || '';
  const dirName = getDirName();
  const dirPath: string = pathResolve(dirName, '../..');

  // Check for linked modules
  checkLinkedModules();

  // Clean output directory before we start adding in new files
  if(remove) {
    await removeFiles(outputDir);
  }

  // Add tsconfig file if none exists
  if(useTypescript) {
    // Make sure tsconfig.build.json exists
    LexConfig.checkCompileTypescriptConfig();

    // Use robust path resolution for TypeScript binary
    const typescriptPath: string = resolveBinaryPath('tsc', 'typescript');

    // Check if TypeScript binary exists
    if(!typescriptPath) {
      log(`\n${cliName} Error: TypeScript binary not found in Lex's node_modules or monorepo root`, 'error', quiet);
      log('Please reinstall Lex or check your installation.', 'info', quiet);
      return 1;
    }

    const typescriptOptions: string[] = config ?
      ['-p', config] :
      ['-p', getTypeScriptConfigPath('tsconfig.build.json')];

    // Start type checking spinner
    spinner.start('Static type checking with Typescript...');

    // Type checking
    try {
      await execa(typescriptPath, typescriptOptions, {encoding: 'utf8'});

      // Stop spinner
      spinner.succeed('Successfully completed type checking!');
    } catch(error) {
      // Display error message
      log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

      // Stop spinner
      spinner.fail('Type checking failed.');

      // Kill Process
      callback(1);
      return 1;
    }
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

  // Get esbuild configuration with defaults for compile (individual files)
  const esbuildConfig = LexConfig.config.esbuild || {};

  // ESBuild options
  const esbuildPath: string = resolveBinaryPath('esbuild', 'esbuild');

  // Check if esbuild binary exists
  if(!esbuildPath) {
    log(`\n${cliName} Error: esbuild binary not found in Lex's node_modules or monorepo root`, 'error', quiet);
    log('Please reinstall Lex or check your installation.', 'info', quiet);
    return 1;
  }

  const esbuildOptions: string[] = [
    ...sourceFiles,
    '--color=true',
    `--format=${esbuildConfig.format || 'esm'}`,
    `--outdir=${outputDir}`,
    `--platform=${esbuildConfig.platform || 'node'}`,
    `--sourcemap=${esbuildConfig.sourcemap || 'inline'}`,
    `--target=${esbuildConfig.target || 'node20'}`
  ];

  // Apply optimization options for compile (more conservative defaults)
  if(esbuildConfig.minify === true) {
    esbuildOptions.push('--minify');
  }

  if(esbuildConfig.treeShaking !== false) {
    esbuildOptions.push('--tree-shaking=true');
  }

  if(esbuildConfig.drop && esbuildConfig.drop.length > 0) {
    esbuildConfig.drop.forEach((item) => {
      esbuildOptions.push(`--drop:${item}`);
    });
  }

  if(esbuildConfig.pure && esbuildConfig.pure.length > 0) {
    esbuildConfig.pure.forEach((item) => {
      esbuildOptions.push(`--pure:${item}`);
    });
  }

  if(esbuildConfig.legalComments) {
    esbuildOptions.push(`--legal-comments=${esbuildConfig.legalComments}`);
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

  if(watch) {
    esbuildOptions.push('--watch');
  }

  // Use PostCSS for CSS files
  const cssFiles: string[] = getFilesByExt('.css', LexConfig.config);

  if(cssFiles.length) {
    const postcssPath: string = resolveBinaryPath('postcss', 'postcss-cli');

    // Check if PostCSS binary exists
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
      // Display error message
      log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

      // Stop spinner
      spinner.fail('Failed formatting css.');

      // Kill Process
      callback(1);
      return 1;
    }
  }

  // Copy image files
  const gifFiles: string[] = getFilesByExt('.gif', LexConfig.config);
  const jpgFiles: string[] = getFilesByExt('.jpg', LexConfig.config);
  const pngFiles: string[] = getFilesByExt('.png', LexConfig.config);
  const svgFiles: string[] = getFilesByExt('.svg', LexConfig.config);
  const imageFiles: string[] = [...gifFiles, ...jpgFiles, ...pngFiles, ...svgFiles];

  if(imageFiles.length) {
    try {
      await copyFiles(imageFiles, 'image', spinner, LexConfig.config);
    } catch(error) {
      // Display error message
      log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

      // Stop spinner
      spinner.fail('Failed to move images to output directory.');

      // Kill Process
      callback(1);
      return 1;
    }
  }

  // Copy font files
  const ttfFiles: string[] = getFilesByExt('.ttf', LexConfig.config);
  const otfFiles: string[] = getFilesByExt('.otf', LexConfig.config);
  const woffFiles: string[] = getFilesByExt('.woff', LexConfig.config);
  const woff2Files: string[] = getFilesByExt('.woff2', LexConfig.config);
  const fontFiles: string[] = [...ttfFiles, ...otfFiles, ...woffFiles, ...woff2Files];

  if(fontFiles.length) {
    try {
      await copyFiles(fontFiles, 'font', spinner, LexConfig.config);
    } catch(error) {
      // Display error message
      log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

      // Stop spinner
      spinner.fail('Failed to move fonts to output directory.');

      // Kill Process
      callback(1);
      return 1;
    }
  }

  // Copy markdown files
  const mdFiles: string[] = getFilesByExt('.md', LexConfig.config);

  if(mdFiles.length) {
    try {
      await copyFiles(mdFiles, 'documents', spinner, LexConfig.config);
    } catch(error) {
      // Display error message
      log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

      // Stop spinner
      spinner.fail('Failed to move docs to output directory.');

      // Kill Process
      callback(1);
      return 1;
    }
  }

  // Start compile spinner
  spinner.start(watch ? 'Watching for changes...' : 'Compiling with ESBuild...');

  try {
    await execa(esbuildPath, esbuildOptions, {encoding: 'utf8'});

    // Stop spinner
    spinner.succeed('Compile completed successfully!');
  } catch(error) {
    // Display error message
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    if(!quiet) {
      console.error(error);
    }

    // Stop spinner
    spinner.fail('Code compiling failed.');

    // Kill Process
    callback(1);
    return 1;
  }

  // Copy configured files after successful compilation
  try {
    await copyConfiguredFiles(spinner, LexConfig.config, quiet);
  } catch(copyError) {
    // Display error message
    log(`\n${cliName} Error: Failed to copy configured files: ${copyError.message}`, 'error', quiet);

    // Stop spinner
    spinner.fail('Failed to copy configured files.');

    // Kill Process
    callback(1);
    return 1;
  }

  // Stop process
  callback(0);
  return 0;
};