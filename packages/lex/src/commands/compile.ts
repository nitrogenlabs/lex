/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import execa from 'execa';
import fs from 'fs';
import glob from 'glob';
import path from 'path';

import {LexConfig} from '../LexConfig';
import {
  checkLinkedModules,
  copyFiles,
  createSpinner,
  getFilesByExt,
  log,
  relativeFilePath,
  removeFiles
} from '../utils';

export const hasFileType = (startPath: string, ext: string[]): boolean => {
  if(!fs.existsSync(startPath)) {
    return false;
  }

  const files: string[] = fs.readdirSync(startPath);

  return files.some((file: string) => {
    const filename: string = path.join(startPath, file);
    const fileExt: string = path.extname(filename);
    const stat = fs.lstatSync(filename);

    if(stat.isDirectory()) {
      // Recursive search
      return hasFileType(filename, ext);
    }

    return ext.includes(fileExt);
  });
};

export const compile = async (cmd: any, callback: any = () => ({})): Promise<number> => {
  const {cliName = 'Lex', config, quiet, remove, watch} = cmd;

  // Spinner
  const spinner = createSpinner(quiet);

  // Display status
  log(`${cliName} compiling...`, 'info', quiet);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  // Compile type
  const {outputFullPath, sourceFullPath, useTypescript} = LexConfig.config;
  const nodePath: string = path.resolve(__dirname, '../../node_modules');

  // Check for linked modules
  checkLinkedModules();

  // Clean output directory before we start adding in new files
  if(remove) {
    await removeFiles(outputFullPath);
  }

  // Add tsconfig file if none exists
  if(useTypescript) {
    // Make sure tsconfig.json exists
    LexConfig.checkTypescriptConfig();

    // Check static types with typescript
    const typescriptPath: string = relativeFilePath('typescript/bin/tsc', nodePath);
    const typescriptOptions: string[] = config ?
      ['-p', config] :
      [
        '--allowSyntheticDefaultImports',
        '--baseUrl', sourceFullPath,
        '--declaration',
        '--emitDeclarationOnly',
        '--inlineSourceMap',
        '--jsx', 'react',
        '--lib', ['ES5', 'ES6', 'ES2015', 'ES7', 'ES2016', 'ES2017', 'ES2018', 'ESNext', 'DOM'],
        '--module', 'commonjs',
        '--moduleResolution', 'node',
        '--noImplicitReturns',
        '--noImplicitThis',
        '--noStrictGenericChecks',
        '--outDir', outputFullPath,
        '--removeComments',
        '--resolveJsonModule',
        '--rootDir', sourceFullPath,
        '--sourceRoot', sourceFullPath,
        '--target', 'ES5',
        '--typeRoots', ['node_modules/@types', 'node_modules/json-d-ts']
      ];

    // Start type checking spinner
    spinner.start('Static type checking with Typescript...');

    // Type checking
    try {
      await execa(typescriptPath, typescriptOptions, {encoding: 'utf-8'});

      // Stop spinner
      spinner.succeed('Successfully completed type checking!');
    } catch(error) {
      // Display error message
      log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

      if(!quiet) {
        console.error(error);
      }

      // Stop spinner
      spinner.fail('Type checking failed.');

      // Kill Process
      callback(error.status);
      return error.status;
    }
  }

  // Source files
  const globOptions = {
    cwd: sourceFullPath,
    dot: false,
    nodir: true,
    nosort: true
  };
  const tsFiles: string[] = glob.sync(`${sourceFullPath}/**/**.ts*`, globOptions);
  const jsFiles: string[] = glob.sync(`${sourceFullPath}/**/**.js`, globOptions);
  const sourceFiles: string[] = [...tsFiles, ...jsFiles];

  // ESBuild options
  const esbuildPath: string = relativeFilePath('esbuild/bin/esbuild', nodePath);
  const esbuildOptions: string[] = [
    ...sourceFiles,
    '--color=true',
    '--format=cjs',
    '--loader:.js=js',
    '--outdir=lib',
    '--platform=node',
    '--sourcemap=inline',
    '--target=node14'
  ];

  if(useTypescript) {
    esbuildOptions.push('--loader:.ts=ts', '--loader:.tsx=tsx');
  }

  if(watch) {
    esbuildOptions.push('--watch');
  }

  // Use PostCSS for CSS files
  const cssFiles: string[] = getFilesByExt('.css');

  if(cssFiles.length) {
    const postcssPath: string = relativeFilePath('postcss-cli/bin/postcss', nodePath);
    const postcssOptions: string[] = [
      `${sourceFullPath}/**/**.css`,
      '--base',
      sourceFullPath,
      '--dir',
      outputFullPath,
      '--config',
      path.resolve(__dirname, '../../.postcssrc.js')
    ];

    try {
      await execa(postcssPath, postcssOptions, {encoding: 'utf-8'});
      spinner.succeed(`Successfully formatted ${cssFiles.length} css files!`);
    } catch(error) {
      // Display error message
      log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

      // Stop spinner
      spinner.fail('Failed formatting css.');

      // Kill Process
      callback(error.status);
      return error.status;
    }
  }

  // Copy image files
  const gifFiles: string[] = getFilesByExt('.gif');
  const jpgFiles: string[] = getFilesByExt('.jpg');
  const pngFiles: string[] = getFilesByExt('.png');
  const svgFiles: string[] = getFilesByExt('.svg');
  const imageFiles: string[] = [...gifFiles, ...jpgFiles, ...pngFiles, ...svgFiles];

  if(imageFiles.length) {
    try {
      await copyFiles(imageFiles, 'image', spinner);
    } catch(error) {
      // Display error message
      log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

      // Stop spinner
      spinner.fail('Failed to move images to output directory.');

      // Kill Process
      callback(error.status);
      return error.status;
    }
  }

  // Copy font files
  const ttfFiles: string[] = getFilesByExt('.ttf');
  const otfFiles: string[] = getFilesByExt('.otf');
  const woffFiles: string[] = getFilesByExt('.woff');
  const woff2Files: string[] = getFilesByExt('.woff2');
  const fontFiles: string[] = [...ttfFiles, ...otfFiles, ...woffFiles, ...woff2Files];

  if(fontFiles.length) {
    try {
      await copyFiles(fontFiles, 'font', spinner);
    } catch(error) {
      // Display error message
      log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

      // Stop spinner
      spinner.fail('Failed to move fonts to output directory.');

      // Kill Process
      callback(error.status);
      return error.status;
    }
  }

  // Copy markdown files
  const mdFiles: string[] = getFilesByExt('.md');

  if(mdFiles.length) {
    try {
      await copyFiles(mdFiles, 'documents', spinner);
    } catch(error) {
      // Display error message
      log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

      // Stop spinner
      spinner.fail('Failed to move docs to output directory.');

      // Kill Process
      callback(error.status);
      return error.status;
    }
  }

  // Start compile spinner
  spinner.start(watch ? 'Watching for changes...' : 'Compiling with ESBuild...');

  try {
    await execa(esbuildPath, esbuildOptions, {encoding: 'utf-8'});

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
    callback(error.status);
    return error.status;
  }

  // Stop process
  callback(0);
  return 0;
};
