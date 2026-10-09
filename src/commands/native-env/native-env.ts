import {resolve} from 'node:path';

import {reportNativeSpawnError, runNativeInteractive} from '../../utils/native/process.js';

export interface NativeEnvOptions {
  args?: readonly string[];
  composeFile?: string;
  cwd?: string;
  service?: string;
  workdir?: string;
}
export interface NativeEnvDependencies {
  run: (command: string, args: readonly string[], cwd: string) => Promise<number>;
}
export const nativeEnv = async (
  options: NativeEnvOptions, callback?: (status: number) => void,
  dependencies: NativeEnvDependencies = {run: runNativeInteractive}
): Promise<number> => {
  const cwd = resolve(options.cwd || process.cwd());
  const args = ['compose', ...(options.composeFile ? ['--file', resolve(cwd, options.composeFile)] : []), 'run', '--rm', '--no-deps', ...(options.workdir ? ['--workdir', options.workdir] : []), options.service || 'android', ...(options.args?.length ? options.args : ['bash'])];
  let status: number;
  try {
    status = await dependencies.run('docker', args, cwd);
  } catch(error) {
    reportNativeSpawnError('docker', error);
    status = 1;
  }
  callback?.(status);
  return status;
};
