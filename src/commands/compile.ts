import chalk from 'chalk';
import cpy from 'cpy';
import execa from 'execa';
import fs from 'fs';
import ora from 'ora';
import * as path from 'path';
import rimraf from 'rimraf';

import {LexConfig} from '../LexConfig';
import {log} from '../utils';

const copyFiles = async (files: string[], outputDir: string, typeName: string, spinner) => {
  const {outputFullPath, sourceFullPath} = LexConfig.config;
  const copyFrom: string[] = files.map((fileName: string) => `${sourceFullPath}/${fileName}`);

  try {
    let total: number = 0;
    spinner.start(`Copying ${typeName} files...\n`);
    await cpy(copyFrom, `${outputFullPath}/${outputDir}`).on('progress', (progress) => {
      total = progress.totalFiles;
      spinner.text = `Copying ${typeName} files (${progress.completedFiles} of ${progress.totalFiles})...\n`;
    });
    spinner.succeed(`Successfully copied ${total} ${typeName} files!`);
  } catch(error) {
    spinner.fail(`Copying of ${typeName} files failed.`);
  }
};

export const compile = async (cmd) => {
  // Spinner
  const spinner = ora({color: 'yellow'});

  // Display status
  log(chalk.cyan('Lex compiling...'), cmd);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  // Compile type
  const {outputFullPath, sourceFullPath, useTypescript} = LexConfig.config;
  const nodePath: string = path.resolve(__dirname, '../../node_modules');

  // Clean output directory before we start adding in new files
  if(cmd.remove) {
    rimraf.sync(outputFullPath);
  }

  // Add tsconfig file if none exists
  if(useTypescript) {
    // Make sure tsconfig.json exists
    LexConfig.checkTypescriptConfig();

    // Check static types with typescript
    const typescriptPath: string = `${nodePath}/typescript/bin/tsc`;
    const typescriptOptions: string[] = cmd.config ?
      ['-p', cmd.config] :
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
    spinner.start('Static type checking with Typescript...\n');

    // Type checking
    const typescript = await execa(typescriptPath, typescriptOptions, {encoding: 'utf-8'});

    // Stop spinner
    if(!typescript.status) {
      spinner.succeed('Successfully completed type checking!');
    } else {
      spinner.fail('Type checking failed.');
      return process.exit(1);
    }
  }

  // Babel options
  const babelPath: string = `${nodePath}/@babel/cli/bin/babel.js`;
  const babelOptions: string[] = [
    '--no-babelrc',
    sourceFullPath,
    '--out-dir',
    outputFullPath,
    '--ignore',
    useTypescript ? '**/*.test.ts*' : '**/*.test.js',
    '--extensions',
    useTypescript ? '.ts,.tsx' : '.js',
    '-s',
    'inline',
    '--presets',
    path.resolve(__dirname, useTypescript ? '../babelTypescriptPreset.js' : '../babelFlowPreset.js')
  ];

  if(cmd.watch) {
    babelOptions.push('--watch');
  }

  // Start type checking spinner
  spinner.start('Compiling with Babel...\n');

  const babel = await execa(babelPath, babelOptions, {encoding: 'utf-8'});

  // Stop spinner
  if(!babel.status) {
    spinner.succeed(babel.stdout);
  } else {
    spinner.fail('Code compiling failed.');
    return process.exit(1);
  }

  if(fs.existsSync(`${sourceFullPath}/styles`)) {
    await copyFiles(['styles/**/*.css'], 'styles', 'css', spinner);
  }

  if(fs.existsSync(`${sourceFullPath}/img`)) {
    await copyFiles(['img/**/*.jpg', 'img/**/*.png', 'img/**/*.gif', 'img/**/*.svg'], 'img', 'image', spinner);
  }

  if(fs.existsSync(`${sourceFullPath}/fonts`)) {
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
  }

  if(fs.existsSync(`${sourceFullPath}/docs`)) {
    await copyFiles(['docs/**/*.md'], 'docs', 'document', spinner);
  }

  // Stop process
  return process.exit(0);
};
