/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import {existsSync, lstatSync, readdirSync} from 'fs';
import {sync as globSync} from 'glob';
import {extname as pathExtname, join as pathJoin, resolve as pathResolve} from 'path';
import {URL} from 'url';

import {LexConfig} from '../../LexConfig.js';
import {checkLinkedModules, copyFiles, createSpinner, getFilesByExt, removeFiles} from '../../utils/app.js';
import {relativeNodePath} from '../../utils/file.js';
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
  const sourceDir: string = sourcePath ? pathResolve(process.cwd(), `./${sourcePath}`) : sourceFullPath;
  const dirName = new URL('.', import.meta.url).pathname;
  const dirPath: string = pathResolve(dirName, '../..');

  // Check for linked modules
  checkLinkedModules();

  // Clean output directory before we start adding in new files
  if(remove) {
    await removeFiles(outputDir);
  }

  // Add tsconfig file if none exists
  if(useTypescript) {
    // Make sure tsconfig.json exists
    LexConfig.checkTypescriptConfig();

    // Check static types with typescript
    const typescriptPath: string = relativeNodePath('typescript/bin/tsc', dirPath);
    const typescriptOptions: string[] = config ?
      ['-p', config] :
      [
        '--allowSyntheticDefaultImports',
        '--baseUrl', sourceDir,
        '--declaration',
        '--emitDeclarationOnly',
        '--lib', 'ESNext,DOM',
        '--module', 'esnext',
        '--moduleResolution', 'node',
        '--noImplicitReturns',
        '--noImplicitThis',
        '--outDir', outputDir,
        '--removeComments',
        '--resolveJsonModule',
        '--target', 'ESNext',
        '--typeRoots', 'node_modules/@types,node_modules/json-d-ts'
      ];

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

  // ESBuild options
  const esbuildPath: string = relativeNodePath('esbuild/bin/esbuild', dirPath);
  const esbuildOptions: string[] = [
    ...sourceFiles,
    '--color=true',
    '--format=cjs',
    `--outdir=${outputDir}`,
    '--platform=node',
    '--sourcemap=inline',
    '--target=node20'
  ];

  if(watch) {
    esbuildOptions.push('--watch');
  }

  // Use PostCSS for CSS files
  const cssFiles: string[] = getFilesByExt('.css', LexConfig.config);

  if(cssFiles.length) {
    const postcssPath: string = relativeNodePath('postcss-cli/index.js', dirPath);
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

  // Stop process
  callback(0);
  return 0;
};