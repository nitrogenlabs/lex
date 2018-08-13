import cpy from 'cpy';
import execa from 'execa';
import fs from 'fs';
import path from 'path';

import {LexConfig} from '../LexConfig';
import {checkLinkedModules, createSpinner, log} from '../utils';
import {removeFiles} from './clean';

const copyFiles = async (files: string[], outputDir: string, typeName: string, spinner) => {
  const {outputFullPath, sourceFullPath} = LexConfig.config;
  const copyFrom: string[] = files.map((fileName: string) => `${sourceFullPath}/${fileName}`);

  try {
    let total: number = 0;
    spinner.start(`Copying ${typeName} files...`);
    await cpy(copyFrom, `${outputFullPath}/${outputDir}`).on('progress', (progress) => {
      total = progress.totalFiles;
      spinner.text = `Copying ${typeName} files (${progress.completedFiles} of ${progress.totalFiles})...`;
    });
    spinner.succeed(`Successfully copied ${total} ${typeName} files!`);
  } catch(error) {
    // Stop spinner
    spinner.fail(`Copying of ${typeName} files failed.`);
  }
};

export const compile = async (cmd) => {
  const {config, quiet, remove, watch} = cmd;

  // Spinner
  const spinner = createSpinner(quiet);

  // Display status
  log('Lex compiling...', 'info', quiet);

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
    const typescriptPath: string = `${nodePath}/typescript/bin/tsc`;
    const typescriptOptions: string[] = config ?
      ['-p', config] :
      [
        '--allowSyntheticDefaultImports',
        '--baseUrl', sourceFullPath,
        '--declaration',
        '--emitDeclarationOnly',
        '--jsx', 'react',
        '--lib', ['esnext', 'dom'],
        '--module', 'commonjs',
        '--moduleResolution', 'node',
        '--noImplicitReturns',
        '--noImplicitThis',
        '--noStrictGenericChecks',
        '--noUnusedLocals',
        '--outDir', outputFullPath,
        '--removeComments',
        '--rootDir', sourceFullPath,
        '--sourceMap',
        '--sourceRoot', sourceFullPath,
        '--target', 'es5',
        '--typeRoots', ['node_modules/@types', 'node_modules/json-d-ts']
      ];

    // Start type checking spinner
    spinner.start('Static type checking with Typescript...');

    // Type checking
    try {
      const typescript = await execa(typescriptPath, typescriptOptions, {encoding: 'utf-8'});

      // Stop spinner
      if(!typescript.status) {
        spinner.succeed('Successfully completed type checking!');
      } else {
        spinner.fail('Type checking failed.');

        // Kill Process
        return process.exit(1);
      }
    } catch(error) {
      // Display error message
      log(`Lex Error: ${error.message}`, 'error', quiet);

      // Stop spinner
      spinner.fail('Type checking failed.');

      // Kill Process
      return process.exit(1);
    }
  }

  // Babel options
  const babelPath: string = `${nodePath}/@babel/cli/bin/babel.js`;
  const transpilerPreset: string = path.resolve(__dirname, useTypescript ? '../babelTypescriptPreset.js' : '../babelFlowPreset.js');
  const userPreset: string = path.resolve(__dirname, '../babelPresets.js');
  const babelOptions: string[] = [
    '--no-babelrc',
    sourceFullPath,
    '--out-dir',
    outputFullPath,
    '--ignore',
    useTypescript ? '**/*.test.ts,**/*.test.tsx' : '**/*.test.js',
    '--extensions',
    useTypescript ? '.ts,.tsx' : '.js',
    '-s',
    'inline',
    '--presets',
    `${transpilerPreset},${userPreset}`
  ];

  if(watch) {
    babelOptions.push('--watch');
  }

  // Start type checking spinner
  spinner.start('Compiling with Babel...');

  try {
    const babel = await execa(babelPath, babelOptions, {encoding: 'utf-8'});

    // Stop spinner
    if(!babel.status) {
      spinner.succeed((babel.stdout || '').replace('.', '!'));
    } else {
      spinner.fail('Code compiling failed.');

      // Kill Process
      return process.exit(1);
    }
  } catch(error) {
    // Display error message
    log(`Lex Error: ${error.message}`, 'error', quiet);

    // Stop spinner
    spinner.fail('Code compiling failed.');

    // Kill Process
    return process.exit(1);
  }

  if(fs.existsSync(`${sourceFullPath}/styles`)) {
    const postcssPath: string = `${nodePath}/postcss-cli/bin/postcss`;
    const postcssOptions: string[] = [
      `${sourceFullPath}/styles/**/*.css`,
      '-d',
      `${outputFullPath}/styles`,
      '--config',
      path.resolve(__dirname, '../../.postcssrc.js')
    ];

    try {
      await execa(postcssPath, postcssOptions, {encoding: 'utf-8'});
      spinner.succeed('Successfully formatted css!');
    } catch(error) {
      // Display error message
      log(`Lex Error: ${error.message}`, 'error', quiet);

      // Stop spinner
      spinner.fail('Failed formatting css.');

      // Kill Process
      return process.exit(1);
    }
  }

  if(fs.existsSync(`${sourceFullPath}/img`)) {
    try {
      await copyFiles(['img/**/*.jpg', 'img/**/*.png', 'img/**/*.gif', 'img/**/*.svg'], 'img', 'image', spinner);
    } catch(error) {
      // Display error message
      log(`Lex Error: ${error.message}`, 'error', quiet);

      // Stop spinner
      spinner.fail('Failed to move images to output directory.');

      // Kill Process
      return process.exit(1);
    }
  }

  if(fs.existsSync(`${sourceFullPath}/fonts`)) {
    try {
      await copyFiles(
        [
          'fonts/**/*.ttf',
          'fonts/**/*.otf',
          'fonts/**/*.woff',
          'fonts/**/*.svg',
          'fonts/**/*.woff2'
        ],
        'fonts',
        'font',
        spinner
      );
    } catch(error) {
      // Display error message
      log(`Lex Error: ${error.message}`, 'error', quiet);

      // Stop spinner
      spinner.fail('Failed to move fonts to output directory.');

      // Kill Process
      return process.exit(1);
    }
  }

  if(fs.existsSync(`${sourceFullPath}/docs`)) {
    try {
      await copyFiles(['docs/**/*.md'], 'docs', 'document', spinner);
    } catch(error) {
      // Display error message
      log(`Lex Error: ${error.message}`, 'error', quiet);

      // Stop spinner
      spinner.fail('Failed to move docs to output directory.');

      // Kill Process
      return process.exit(1);
    }
  }

  // Stop process
  return process.exit(0);
};
