/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import {cpSync, existsSync, lstatSync, mkdirSync, realpathSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {homedir, tmpdir} from 'node:os';
import {basename, dirname, isAbsolute, parse, relative, resolve, sep} from 'node:path';

import {createRuntimeLock} from '../../utils/deployment/runtime.js';
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
  readonly runtimeArchitecture?: NodeJS.Architecture;
  readonly runtimeContext?: string;
  readonly runtimeDependencies?: string | string[];
  readonly runtimeLockfile?: string;
  readonly runtimePlatform?: NodeJS.Platform;
  readonly smokeArgs?: readonly string[];
  readonly smokeCommand?: string;
  readonly sourcemap?: boolean;
  readonly target?: string;
}
export type ServerlessDeployCallback = (status: number) => void;
export interface ServerlessDeployRunOptions {
  cwd: string;
  env?: NodeJS.ProcessEnv;
  stdio: 'inherit' | 'pipe';
}
export interface ServerlessDeployDependencies {
  hostArchitecture?: NodeJS.Architecture;
  hostPlatform?: NodeJS.Platform;
  run: (command: string, args: readonly string[], options: ServerlessDeployRunOptions) => Promise<unknown>;
}
const toList = (value?: string | string[]): string[] => {
  if(!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
};
const contains = (parent: string, child: string): boolean => {
  const path = relative(parent, child);
  return !path || (!isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`));
};
const canonical = (path: string): string => {
  if(existsSync(path)) {
    return realpathSync(path);
  }
  const parent = dirname(path);
  return resolve(parent === path ? parent : canonical(parent), basename(path));
};
const formatSize = (bytes: number): string => {
  if(bytes < 1024) {
    return `${bytes} B`;
  }
  if(bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
const defaultDependencies: ServerlessDeployDependencies = {
  run: async (command, args, options) => execa(command, args, options)
};
export const serverlessDeploy = async (
  cmd: ServerlessDeployOptions,
  callback: ServerlessDeployCallback = () => {},
  dependencies: ServerlessDeployDependencies = defaultDependencies
): Promise<number> => {
  const {bundle = true, cliName = 'Lex', entry, format = 'cjs', mainFields = 'module,main', minify = false, nodeModulesPath = './node_modules', output = './lambda-package.zip', packageDir = './.lex/lambda-package', platform = 'node', quiet, sourcemap = false, target = 'node24'} = cmd;
  const fail = (): number => {
    log(`\n${cliName} Error: Lambda package failed; check entry, safe paths, runtime target and smoke command.`, 'error', quiet);
    callback(1);
    return 1;
  };
  let outputPath: string | undefined;
  let assemblyStarted = false;
  try {
    const cwd = canonical(process.cwd());
    if(!entry || !existsSync(resolve(cwd, entry))) {
      return fail();
    }
    const entryPath = canonical(resolve(cwd, entry));
    if(!statSync(entryPath).isFile()) {
      return fail();
    }
    const packageInput = resolve(cwd, packageDir);
    if(existsSync(packageInput) && lstatSync(packageInput).isSymbolicLink()) {
      return fail();
    }
    const packagePath = canonical(packageInput);
    outputPath = canonical(resolve(cwd, output));
    const outfile = canonical(resolve(cwd, cmd.outfile || `${packageDir}/index.js`));
    const moduleRoot = canonical(resolve(cwd, nodeModulesPath));
    const copyModules = toList(cmd.copyNodeModule);
    const runtimeDependencies = toList(cmd.runtimeDependencies);
    const protectedPaths = [cwd, entryPath, canonical(homedir()), canonical(tmpdir()), parse(cwd).root];
    if(cmd.runtimeContext) {
      protectedPaths.push(canonical(resolve(cwd, cmd.runtimeContext)));
    }
    if(cmd.runtimeLockfile) {
      protectedPaths.push(canonical(resolve(cwd, cmd.runtimeLockfile)));
    }
    if(protectedPaths.some((path) => contains(packagePath, path)) ||
            contains(moduleRoot, packagePath) || contains(packagePath, moduleRoot) || packagePath.split(sep).includes('.git') ||
            !contains(packagePath, outfile) || outfile === packagePath ||
            contains(packagePath, outputPath) || protectedPaths.some((path) => contains(outputPath!, path)) ||
            !outputPath.endsWith('.zip') ||
      copyModules.some((name) => !/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/u.test(name))) {
      return fail();
    }
    if(copyModules.some((name) => {
      const source = resolve(moduleRoot, name);
      return existsSync(source) &&
        (contains(canonical(source), packagePath) || contains(packagePath, canonical(source)));
    })) {
      return fail();
    }
    if(cmd.smokeArgs?.length && !cmd.smokeCommand) {
      return fail();
    }
    if(runtimeDependencies.length && (!cmd.runtimeContext || !cmd.runtimeLockfile || !cmd.runtimePlatform ||
            !cmd.runtimeArchitecture || !cmd.smokeCommand || copyModules.length ||
            cmd.runtimePlatform !== (dependencies.hostPlatform || process.platform) ||
            cmd.runtimeArchitecture !== (dependencies.hostArchitecture || process.arch))) {
      return fail();
    }
    const runtime = runtimeDependencies.length ? createRuntimeLock({
      context: resolve(cwd, cmd.runtimeContext!),
      dependencies: runtimeDependencies,
      lockfile: resolve(cwd, cmd.runtimeLockfile!)
    }) : undefined;
    log(`${cliName} packaging Lambda bundle...`, 'info', quiet);
    rmSync(packagePath, {
      force: true, recursive: true
    });
    rmSync(outputPath, {
      force: true
    });
    assemblyStarted = true;
    mkdirSync(dirname(outfile), {
      recursive: true
    });
    const esbuildArgs = [entryPath, bundle ? '--bundle' : '--bundle=false', `--platform=${platform}`, `--target=${target}`,
      `--format=${format}`, `--main-fields=${mainFields}`, '--tree-shaking=true', '--legal-comments=none', `--outfile=${outfile}`];
    if(minify) {
      esbuildArgs.push('--minify');
    }
    if(sourcemap) {
      esbuildArgs.push('--sourcemap');
    }
    const externals = new Set([...toList(cmd.external), ...runtimeDependencies.flatMap((name) => [name, `${name}/*`])]);
    for(const external of externals) {
      esbuildArgs.push(`--external:${external}`);
    }
    await dependencies.run('npx', ['--no-install', 'esbuild', ...esbuildArgs], {
      cwd, stdio: 'pipe'
    });
    for(const moduleName of copyModules) {
      const source = resolve(moduleRoot, moduleName);
      const destination = resolve(packagePath, 'node_modules', moduleName);
      if(!existsSync(source)) {
        log(`${cliName} warning: node module not found, "${moduleName}".`, 'warn', quiet);
        continue;
      }
      mkdirSync(dirname(destination), {
        recursive: true
      });
      cpSync(source, destination, {
        recursive: true
      });
    }
    if(runtime) {
      writeFileSync(resolve(packagePath, 'package.json'), JSON.stringify({
        ...runtime.manifest, type: format === 'esm' ? 'module' : 'commonjs'
      }, null, 2));
      writeFileSync(resolve(packagePath, 'package-lock.json'), JSON.stringify(runtime.lock, null, 2));
      await dependencies.run('npm', ['ci', '--omit=dev', '--include=optional', '--ignore-scripts', '--workspaces=false',
        `--os=${cmd.runtimePlatform}`, `--cpu=${cmd.runtimeArchitecture}`], {
        cwd: packagePath, env: {
          ...process.env, npm_config_arch: cmd.runtimeArchitecture, npm_config_platform: cmd.runtimePlatform
        }, stdio: 'pipe'
      });
    }
    if(cmd.smokeCommand) {
      await dependencies.run(cmd.smokeCommand, cmd.smokeArgs || [], {
        cwd: packagePath, stdio: 'pipe'
      });
    }
    mkdirSync(dirname(outputPath), {
      recursive: true
    });
    await dependencies.run('zip', ['-qr', outputPath, '.'], {
      cwd: packagePath, stdio: 'pipe'
    });
    log(`${cliName} Lambda package created: ${outputPath} (${formatSize(statSync(outputPath).size)})`, 'success', quiet);
    callback(0);
    return 0;
  } catch{
    if(assemblyStarted && outputPath) {
      rmSync(outputPath, {
        force: true
      });
    }
    return fail();
  }
};
