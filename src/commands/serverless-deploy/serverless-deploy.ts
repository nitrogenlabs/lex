/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import {cpSync, existsSync, mkdirSync, rmSync, statSync} from 'fs';
import {dirname, resolve} from 'path';

import {log} from '../../utils/log.js';

export interface ServerlessDeployOptions {
  readonly bundle?: boolean;
  readonly cliName?: string;
  readonly copyNodeModule?: string | string[];
  readonly entry?: string;
  readonly external?: string | string[];
  readonly format?: 'cjs' | 'esm';
  readonly mainFields?: string;
  readonly minify?: boolean;
  readonly nodeModulesPath?: string;
  readonly outfile?: string;
  readonly output?: string;
  readonly packageDir?: string;
  readonly platform?: 'node';
  readonly quiet?: boolean;
  readonly sourcemap?: boolean;
  readonly target?: string;
}

export type ServerlessDeployCallback = (status: number) => void;

const toList = (value?: string | string[]): string[] => {
  if(!value) return [];
  return Array.isArray(value) ? value : [value];
};

const formatSize = (bytes: number): string => {
  if(bytes < 1024) return `${bytes} B`;
  if(bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const serverlessDeploy = async (
  cmd: ServerlessDeployOptions,
  callback: ServerlessDeployCallback = () => ({})
): Promise<number> => {
  const {
    bundle = true,
    cliName = 'Lex',
    entry,
    format = 'cjs',
    mainFields = 'module,main',
    minify = false,
    nodeModulesPath = './node_modules',
    output = './lambda-package.zip',
    packageDir = './.lex/lambda-package',
    platform = 'node',
    quiet,
    sourcemap = false,
    target = 'node24'
  } = cmd;

  if(!entry) {
    log(`\n${cliName} Error: --entry is required.`, 'error', quiet);
    callback(1);
    return 1;
  }

  const entryPath = resolve(process.cwd(), entry);
  if(!existsSync(entryPath)) {
    log(`\n${cliName} Error: Entry file not found, "${entry}".`, 'error', quiet);
    callback(1);
    return 1;
  }

  const outputPath = resolve(process.cwd(), output);
  const packagePath = resolve(process.cwd(), packageDir);
  const outfile = resolve(process.cwd(), cmd.outfile || `${packageDir}/index.js`);

  try {
    log(`${cliName} packaging Lambda bundle...`, 'info', quiet);

    rmSync(packagePath, {force: true, recursive: true});
    rmSync(outputPath, {force: true});
    mkdirSync(dirname(outfile), {recursive: true});

    const esbuildArgs = [
      entryPath,
      bundle ? '--bundle' : '--bundle=false',
      `--platform=${platform}`,
      `--target=${target}`,
      `--format=${format}`,
      `--main-fields=${mainFields}`,
      '--tree-shaking=true',
      '--legal-comments=none',
      `--outfile=${outfile}`
    ];

    if(minify) {
      esbuildArgs.push('--minify');
    }

    if(sourcemap) {
      esbuildArgs.push('--sourcemap');
    }

    for(const external of toList(cmd.external)) {
      esbuildArgs.push(`--external:${external}`);
    }

    await execa('npx', ['--no-install', 'esbuild', ...esbuildArgs], {
      cwd: process.cwd(),
      stdio: 'inherit'
    });

    for(const moduleName of toList(cmd.copyNodeModule)) {
      const source = resolve(process.cwd(), nodeModulesPath, moduleName);
      const destination = resolve(packagePath, 'node_modules', moduleName);

      if(!existsSync(source)) {
        log(`${cliName} warning: node module not found, "${moduleName}".`, 'warn', quiet);
        continue;
      }

      mkdirSync(dirname(destination), {recursive: true});
      cpSync(source, destination, {recursive: true});
    }

    mkdirSync(dirname(outputPath), {recursive: true});
    await execa('zip', ['-qr', outputPath, '.'], {
      cwd: packagePath,
      stdio: 'inherit'
    });

    log(`${cliName} Lambda package created: ${outputPath} (${formatSize(statSync(outputPath).size)})`, 'success', quiet);
    callback(0);
    return 0;
  } catch(error) {
    log(`\n${cliName} Error: Lambda package failed. ${error.message}`, 'error', quiet);
    callback(1);
    return 1;
  }
};
