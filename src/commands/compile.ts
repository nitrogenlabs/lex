import chalk from 'chalk';
import {spawnSync, SpawnSyncReturns} from 'child_process';
import * as path from 'path';
import rimraf from 'rimraf';

import {LexConfig} from '../LexConfig';
import {log} from '../utils';

export const compile = (cmd) => {
  const cwd: string = process.cwd();
  let status: number = 0;

  log(chalk.cyan('Lex compiling...'), cmd);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  // Compile type
  const {outputDir, sourceDir, useTypescript} = LexConfig.config;
  const nodePath: string = path.resolve(__dirname, '../../node_modules');

  // Clean output directory before we start adding in new files
  if(cmd.remove) {
    rimraf.sync(path.resolve(cwd, outputDir));
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
        '--baseUrl', sourceDir,
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
        '--outDir', outputDir,
        '--removeComments',
        '--rootDir', sourceDir,
        '--sourceMap',
        '--sourceRoot', sourceDir,
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
  const babelPresets: string[] = [
    `${nodePath}/@babel/preset-env`,
    useTypescript ? `${nodePath}/@babel/preset-typescript` : `${nodePath}/@babel/preset-flow`,
    `${nodePath}/@babel/preset-react`,
    `${nodePath}/@nlabs/preset-stage-0`
  ];
  const babelPlugins: string[] = [
    `${nodePath}/@babel/plugin-proposal-pipeline-operator`
  ];
  const babelOptions: string[] = [
    '--no-babelrc',
    sourceDir,
    '--out-dir',
    outputDir,
    '--ignore',
    useTypescript ? '**/*.test.ts*' : '**/*.test.js',
    '--extensions',
    useTypescript ? '.ts,.tsx' : '.js',
    '-s',
    'inline',
    '--presets',
    babelPresets.join(','),
    '--plugins',
    babelPlugins.join(',')
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
