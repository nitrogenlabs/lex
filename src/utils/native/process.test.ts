import {EventEmitter} from 'node:events';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {delimiter, join} from 'node:path';
import {describe, expect, it, vi} from 'vitest';

import {nativeDoctor} from '../../commands/native-doctor/native-doctor.js';
import {nativeEnv} from '../../commands/native-env/native-env.js';
import {findNativeExecutable, nativeDirectoryExists, reportNative, runNativeCheck, runNativeInteractive} from './process.js';

const {spawn, spawnSync} = vi.hoisted(() => ({spawn: vi.fn(), spawnSync: vi.fn()}));
vi.mock('node:child_process', () => ({spawn, spawnSync}));

describe('native subprocess boundary', () => {
  it('finds executable PATH candidates and skips inaccessible entries', () => {
    const directory = mkdtempSync(join(tmpdir(), 'native-path-'));
    try {
      writeFileSync(join(directory, 'fixture'), 'fixture', {mode: 0o755});

      expect(findNativeExecutable('fixture', {PATH: `/missing${delimiter}${directory}`})).toBe(join(directory, 'fixture'));
      expect(findNativeExecutable('absent-native-fixture', {})).toBeUndefined();
      expect(nativeDirectoryExists(directory)).toBe(true);

      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      reportNative('fixture');

      expect(log).toHaveBeenCalledWith('fixture');

      log.mockRestore();
    } finally {
      rmSync(directory, {force: true, recursive: true});
    }
  });

  it.each([[0, null, 0], [37, null, 37], [null, 'SIGINT', 130], [null, 'SIGTERM', 143], [null, null, 1]])('inherits interactive IO and maps status/signals (%s/%s)', async (status, signal, expected) => {
    const child = new EventEmitter() as EventEmitter & {kill: ReturnType<typeof vi.fn>};
    child.kill = vi.fn();
    spawn.mockReturnValue(child);
    const before = process.listenerCount('SIGINT');
    const result = runNativeInteractive('docker', ['fixture'], '/project');

    expect(spawn).toHaveBeenLastCalledWith('docker', ['fixture'], {cwd:'/project',env:process.env,shell:false,stdio:'inherit'});

    child.emit('exit', status, signal);

    expect(await result).toBe(expected);
    expect(process.listenerCount('SIGINT')).toBe(before);
  });

  it('forwards both parent signals and cleans listeners on spawn error', async () => {
    const child = new EventEmitter() as EventEmitter & {kill: ReturnType<typeof vi.fn>};
    child.kill = vi.fn();
    spawn.mockReturnValue(child);
    const oldInt = new Set(process.listeners('SIGINT'));
    const oldTerm = new Set(process.listeners('SIGTERM'));
    const result = nativeEnv({});
    process.listeners('SIGINT').find((listener) => !oldInt.has(listener))!('SIGINT');
    process.listeners('SIGTERM').find((listener) => !oldTerm.has(listener))!('SIGTERM');

    expect(child.kill.mock.calls).toEqual([['SIGINT'],['SIGTERM']]);

    const write = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    try {
      child.emit('error', new Error('missing'));

      expect(await result).toBe(1);
    } finally {
      write.mockRestore();
    }

    expect(process.listeners('SIGINT')).toEqual([...oldInt]);
    expect(process.listeners('SIGTERM')).toEqual([...oldTerm]);
  });

  it.each(['ENOENT', 'EACCES'])('reports spawn code %s without echoing arguments, cwd or error message', async (code) => {
    const child = new EventEmitter() as EventEmitter & {kill: ReturnType<typeof vi.fn>};
    child.kill = vi.fn();
    spawn.mockReturnValue(child);
    const write = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    try {
      const result = runNativeInteractive('docker', ['secret-token'], '/secret-path');
      const error = new Error('secret-token /secret-path');
      Object.defineProperty(error, 'code', {value: code});
      child.emit('error', error);

      expect(await result).toBe(1);

      const output = write.mock.calls.map(([message]) => String(message)).join('');

      expect(output).toContain('docker');
      expect(output).toContain(code);
      expect(output).not.toContain('secret-token');
      expect(output).not.toContain('/secret-path');
    } finally {
      write.mockRestore();
    }
  });

  it.each([{status:0,stdout:'version'}, {status:37,stdout:''}, {status:null,stdout:null}, {error:new Error('missing'),status:0,stdout:''}])('captures check status and stdout only', (fixture) => {
    spawnSync.mockReturnValue(fixture);

    expect(runNativeCheck('ruby',['--version'],'/project',{})).toEqual({status:fixture.error || fixture.status === null ? 1 : fixture.status,stdout:fixture.stdout || ''});
  });

  it('supports default doctor bindings without running host tools', async () => {
    spawnSync.mockReturnValue({status:0,stdout:'fixture'});
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const directory = mkdtempSync(join(tmpdir(), 'native-doctor-path-'));
    writeFileSync(join(directory, 'watchman'), 'fixture', {mode: 0o755});
    vi.stubEnv('PATH', directory);
    try {
      expect(await nativeDoctor({platform:'ios'})).toBe(0);
      expect(log).toHaveBeenCalledWith(`ok  watchman: ${join(directory, 'watchman')}`);
    } finally {
      vi.unstubAllEnvs();
      log.mockRestore();
      rmSync(directory, {force: true, recursive: true});
    }
  });
});
