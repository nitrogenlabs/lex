import {spawn, spawnSync} from 'node:child_process';
import {accessSync, constants, existsSync} from 'node:fs';
import {constants as osConstants} from 'node:os';
import {delimiter, join} from 'node:path';

export const findNativeExecutable = (command: string, env: NodeJS.ProcessEnv): string | undefined => {
  for(const directory of (env.PATH || '').split(delimiter)) {
    const path = join(directory || '.', command);
    try {
      accessSync(path, constants.X_OK);
      return path;
    } catch{
      // Continue through PATH, just as command -v does.
    }
  }
  return undefined;
};

export const reportNativeSpawnError = (command: string, error: unknown): void => {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
  let diagnostic = 'subprocess launch failed';
  if(code === 'ENOENT') {
    diagnostic = 'ENOENT: executable or working directory not found';
  } else if(code === 'EACCES') {
    diagnostic = 'EACCES: permission denied';
  }
  process.stderr.write(`Unable to start ${command}: ${diagnostic}.\n`);
};

export const runNativeInteractive = (
  command: string, args: readonly string[], cwd: string
): Promise<number> => new Promise((resolve) => {
  const child = spawn(command, [...args], {cwd, env: process.env, shell: false, stdio: 'inherit'});
  const interrupt = () => {
    child.kill('SIGINT');
  };
  const terminate = () => {
    child.kill('SIGTERM');
  };
  const finish = (status: number) => {
    process.off('SIGINT', interrupt);
    process.off('SIGTERM', terminate);
    resolve(status);
  };
  process.on('SIGINT', interrupt);
  process.on('SIGTERM', terminate);
  child.once('error', (error) => {
    reportNativeSpawnError(command, error);
    finish(1);
  });
  child.once('exit', (status, signal) => finish(status ?? (signal ? 128 + osConstants.signals[signal] : 1)));
});

export const runNativeCheck = (
  command: string, args: readonly string[], cwd: string, env: NodeJS.ProcessEnv
): {status: number; stdout: string} => {
  const result = spawnSync(command, [...args], {cwd, encoding: 'utf8', env, shell: false, stdio: ['ignore', 'pipe', 'pipe']});
  return {status: result.error || result.status === null ? 1 : result.status, stdout: result.stdout || ''};
};

export const nativeDirectoryExists = existsSync;
export const reportNative = (message: string): void => {
  // eslint-disable-next-line no-console
  console.log(message);
};
