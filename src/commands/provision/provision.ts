import {readFileSync, realpathSync, statSync} from 'node:fs';
import {isAbsolute, join, relative, resolve, sep} from 'node:path';

import {relativeNodePath} from '../../utils/file.js';
import {reportNativeSpawnError, runNativeInteractive} from '../../utils/native/process.js';

export type ProvisionOperation = 'artifact-publish' | 'stack-create' | 'stack-update';
export interface ProvisionOptions {
  args?: readonly string[];
  cwd?: string;
  operation: ProvisionOperation;
}
export interface ProvisionDependencies {
  resolveCli: (cwd: string) => string;
  run: (command: string, args: readonly string[], cwd: string) => Promise<number>;
}

/** Resolve the caller's installed public package, including hoisted npm workspaces. */
export const resolveProvisioningCli = (cwd: string, findPackage = relativeNodePath): string => {
  const directory = findPackage('@nlabs/reaktor-provisioning', cwd);
  if(!directory) {
    throw new Error('Provisioning package unavailable');
  }
  const root = realpathSync(directory);
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const bin = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin?.['reaktor-provisioning'];
  if(manifest.name !== '@nlabs/reaktor-provisioning' || typeof bin !== 'string' || isAbsolute(bin)) {
    throw new Error('Provisioning package unavailable');
  }
  const executable = realpathSync(resolve(root, bin));
  const path = relative(root, executable);
  if(!path || path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path) || !statSync(executable).isFile()) {
    throw new Error('Provisioning package unavailable');
  }
  return executable;
};

/** Lex owns entry/signal forwarding; the public provider owns credentials, custody and AWS operations. */
export const provision = async (
  options: ProvisionOptions, callback?: (status: number) => void,
  dependencies: ProvisionDependencies = {resolveCli: resolveProvisioningCli,
    run: (command, args, cwd) => runNativeInteractive(command, args, cwd, 'node')}
): Promise<number> => {
  let status = 1;
  try {
    const {operation} = options;
    if(options.args !== undefined && !Array.isArray(options.args)) {
      throw new Error('Provisioning arguments unavailable');
    }
    const args = [...(options.args ?? [])];
    if(!['artifact-publish', 'stack-create', 'stack-update'].includes(operation) || args.length > 128
      || args.some((arg) => typeof arg !== 'string' || arg.includes('\0') || arg.length > 65536)) {
      throw new Error('Provisioning arguments unavailable');
    }
    const cwd = resolve(options.cwd ?? process.cwd());
    const executable = dependencies.resolveCli(cwd);
    const result = await dependencies.run(process.execPath, [executable, operation, ...args], cwd);
    if(!Number.isInteger(result) || result < 0 || result > 255) {
      throw new Error('Provisioning exit status unavailable');
    }
    status = result;
  } catch(error) {
    reportNativeSpawnError('node', error);
  }
  callback?.(status);
  return status;
};
