import chalk from 'chalk';
import {spawnSync, SpawnSyncReturns} from 'child_process';
import * as path from 'path';
import rimraf from 'rimraf';

import {LexConfig} from '../LexConfig';
import {log} from '../utils';

export const compile = (cmd) => {
  let status: number = 0;

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

    const typescript = spawnSync(typescriptPath, typescriptOptions, {
      encoding: 'utf-8',
      stdio: 'inherit'
    });

    status += typescript.status;
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

  const babel: SpawnSyncReturns<Buffer> = spawnSync(babelPath, babelOptions, {
    encoding: 'utf-8',
    stdio: 'inherit'
  });

  status += babel.status;

  process.exit(status);
};
