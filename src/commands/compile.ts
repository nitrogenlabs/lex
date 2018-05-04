import chalk from 'chalk';
import {spawnSync} from 'child_process';
import * as path from 'path';

import {LexConfig} from '../LexConfig';

export const compile = (lexConfigFile: string, cmd) => {
  const cwd: string = process.cwd();
  console.log(chalk.cyan('Lex compiling...'));

  // Get custom configuration
  const configPath: string = lexConfigFile || path.resolve(cwd, './lex.config.js');
  LexConfig.parseConfig(configPath);

  // Compile using typescript
  const typescriptPath: string = path.resolve(__dirname, '../../node_modules/typescript/bin/tsc');
  const typescriptOptions = cmd.config ?
    ['-p', cmd.config] :
    [
      '--allowSyntheticDefaultImports', true,
      '--baseUrl', LexConfig.config.sourceDir,
      '--declaration', true,
      '--jsx', 'react',
      '--lib', ['esnext', 'dom'],
      '--module', 'commonjs',
      '--moduleResolution', 'node',
      '--noImplicitReturns', true,
      '--noImplicitThis', true,
      '--noStrictGenericChecks', true,
      '--noUnusedLocals', true,
      '--outDir', LexConfig.config.outputDir,
      '--removeComments', true,
      '--rootDir', LexConfig.config.sourceDir,
      '--sourceMap', true,
      '--sourceRoot', LexConfig.config.sourceDir,
      '--target', 'es5',
      '--typeRoots', ['node_modules/@types', 'node_modules/json-d-ts']
    ];
  const typescript = spawnSync(typescriptPath, typescriptOptions, {
    encoding: 'utf-8',
    stdio: 'inherit'
  });

  process.exit(typescript.status);
};
