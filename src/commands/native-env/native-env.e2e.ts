import {expect, test} from '@playwright/test';
import {spawn} from 'node:child_process';
import {accessSync, constants, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const cli = fileURLToPath(new URL('../../../lib/lex.js', import.meta.url));

test('public native-env forwards SIGTERM after Docker is ready', async () => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), 'lex-native-signal-')));
  const ready = join(directory, 'ready');
  let child: ReturnType<typeof spawn> | undefined;
  let exited: Promise<{code: number | null; signal: NodeJS.Signals | null}> | undefined;
  let reapTimer: ReturnType<typeof setTimeout> | undefined;

  try {
    accessSync(cli, constants.R_OK);
    writeFileSync(join(directory, 'docker'), `#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(ready)},String(process.pid));setInterval(()=>{},1000);`, {mode: 0o755});
    child = spawn(process.execPath, [cli, 'native-env', '--cwd', directory, '--'], {
      cwd: directory,
      env: {...process.env, PATH: directory},
      stdio: 'ignore'
    });
    exited = new Promise((resolve, reject) => {
      child!.once('error', reject);
      child!.once('close', (code, signal) => resolve({code, signal}));
    });
    reapTimer = setTimeout(() => child?.kill('SIGKILL'), 12000);
    await expect.poll(() => existsSync(ready), {timeout: 10000}).toBe(true);
    expect(child.kill('SIGTERM')).toBe(true);
    expect(await exited).toEqual({code: 143, signal: null});
  } finally {
    if(child && child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
      await exited;
    }
    clearTimeout(reapTimer);
    if(existsSync(ready)) {
      const pid = Number(readFileSync(ready, 'utf8'));
      try {
        process.kill(pid, 'SIGKILL');
      } catch{
        // The normal signal path has already reaped the fake Docker process.
      }
    }
    child?.removeAllListeners();
    rmSync(directory, {force: true, recursive: true});
  }
});
