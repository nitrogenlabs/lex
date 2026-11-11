import {EventEmitter} from 'node:events';
import {mkdtempSync, mkdirSync, realpathSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach, expect, test, vi} from 'vitest';

import {provision, resolveProvisioningCli} from './provision.js';

const {spawn} = vi.hoisted(() => ({spawn: vi.fn()}));
vi.mock('node:child_process', () => ({spawn, spawnSync: vi.fn()}));

const temporary: string[] = [];
const fixture = () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'lex-provision-')));
  temporary.push(cwd);
  const directory = join(cwd, 'node_modules/@nlabs/reaktor-provisioning');
  mkdirSync(join(directory, 'lib'), {recursive: true});
  writeFileSync(join(directory, 'package.json'), JSON.stringify({bin: {'reaktor-provisioning': './lib/cli.js'},
    name: '@nlabs/reaktor-provisioning', version: '1.1.4'}));
  writeFileSync(join(directory, 'lib/cli.js'), 'export {};\n');
  return {cwd, directory};
};

afterEach(() => {
  temporary.splice(0).forEach((path) => rmSync(path, {force: true, recursive: true}));
  vi.restoreAllMocks();
  spawn.mockReset();
});

test('resolves the public declared bin from the caller and a hoisted workspace', () => {
  const {cwd, directory} = fixture();
  mkdirSync(join(cwd, 'api'));

  expect(resolveProvisioningCli(cwd)).toBe(join(directory, 'lib/cli.js'));
  expect(resolveProvisioningCli(join(cwd, 'api'))).toBe(join(directory, 'lib/cli.js'));
});

test.each([
  'missing', 'name', 'absolute', 'escape', 'symlink', 'directory', 'malformed', 'bin'
])('refuses %s provider metadata or executable before execution', (mode) => {
  const {cwd, directory} = fixture();
  const manifest = {bin: {'reaktor-provisioning': './lib/cli.js'}, name: '@nlabs/reaktor-provisioning'};
  if(mode === 'missing') {
    rmSync(directory, {recursive: true});
  } else if(mode === 'name') {
    manifest.name = 'another-package';
  } else if(mode === 'absolute' || mode === 'escape') {
    writeFileSync(join(cwd, 'outside.js'), 'export {};\n');
    manifest.bin['reaktor-provisioning'] = mode === 'absolute' ? join(cwd, 'outside.js') : '../../../outside.js';
  } else if(mode === 'symlink') {
    writeFileSync(join(cwd, 'outside.js'), 'export {};\n');
    rmSync(join(directory, 'lib/cli.js'));
    symlinkSync(join(cwd, 'outside.js'), join(directory, 'lib/cli.js'));
  } else if(mode === 'directory') {
    rmSync(join(directory, 'lib/cli.js'));
    mkdirSync(join(directory, 'lib/cli.js'));
  } else if(mode === 'bin') {
    Reflect.deleteProperty(manifest, 'bin');
  }
  if(mode !== 'missing') {
    writeFileSync(join(directory, 'package.json'), mode === 'malformed' ? '{' : JSON.stringify(manifest));
  }

  expect(() => resolveProvisioningCli(cwd, () => directory)).toThrow();
});

test('supports the public single-bin manifest form', () => {
  const {cwd, directory} = fixture();
  writeFileSync(join(directory, 'package.json'), JSON.stringify({bin: './lib/cli.js', name: '@nlabs/reaktor-provisioning'}));

  expect(resolveProvisioningCli(cwd)).toBe(join(directory, 'lib/cli.js'));
});

test('default native binding executes by absolute Node path but sanitizes asynchronous launch failures', async () => {
  const {cwd, directory} = fixture();
  const child = new EventEmitter() as EventEmitter & {kill: ReturnType<typeof vi.fn>};
  child.kill = vi.fn();
  spawn.mockReturnValue(child);
  const write = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  const result = provision({cwd, operation: 'stack-update'});
  child.emit('error', {code: 'ENOENT', message: 'PRIVATE_ERROR'});

  expect(await result).toBe(1);
  expect(spawn).toHaveBeenCalledWith(process.execPath, [join(directory, 'lib/cli.js'), 'stack-update'],
    {cwd, env: process.env, shell: false, stdio: 'inherit'});
  expect(write.mock.calls.flat().join('')).toContain('Unable to start node:');
  expect(write.mock.calls.flat().join('')).not.toMatch(/PRIVATE|lex-provision-/);
});

test.each(['stack-create', 'stack-update', 'artifact-publish', 'cloudfront-api-routing', 'ui-publish'] as const)('preserves %s structured argv, cwd and exit status', async (operation) => {
  const run = vi.fn(async () => 37);
  const callback = vi.fn();
  const resolveCli = vi.fn(() => '/caller/provider.js');
  const args = ['--binding', 'file with spaces.json', '--profile', 'exact', ''];

  expect(await provision({args, cwd: '/caller', operation}, callback, {resolveCli, run})).toBe(37);
  expect(resolveCli).toHaveBeenCalledWith('/caller');
  expect(run).toHaveBeenCalledWith(process.execPath, ['/caller/provider.js', operation, ...args], '/caller');
  expect(callback).toHaveBeenCalledExactlyOnceWith(37);
});

test('default caller cwd and empty arguments are preserved', async () => {
  const run = vi.fn(async () => 0);
  const resolveCli = vi.fn(() => '/caller/provider.js');

  expect(await provision({operation: 'stack-update'}, undefined, {resolveCli, run})).toBe(0);
  expect(run).toHaveBeenCalledWith(process.execPath, ['/caller/provider.js', 'stack-update'], process.cwd());
});

test.each(['operation', 'nul', 'non-array', 'non-string', 'too-many', 'too-long'])('refuses invalid %s without resolution or execution', async (mode) => {
  const run = vi.fn(async () => 0);
  const resolveCli = vi.fn(() => '/caller/provider.js');
  const write = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  const value = {args: [] as unknown[], operation: 'stack-update'};
  if(mode === 'operation') {
    value.operation = 'lambda-update';
  }
  if(mode === 'non-array') {
    Reflect.set(value, 'args', 'unexpected');
  }
  if(mode === 'nul') {
    value.args = ['secret\0value'];
  }
  if(mode === 'non-string') {
    value.args = [42];
  }
  if(mode === 'too-many') {
    value.args = Array(129).fill('x');
  }
  if(mode === 'too-long') {
    value.args = ['x'.repeat(65537)];
  }

  expect(await provision(value as never, undefined, {resolveCli, run})).toBe(1);
  expect(resolveCli).not.toHaveBeenCalled();
  expect(run).not.toHaveBeenCalled();
  expect(write.mock.calls.flat().join('')).not.toContain('secret');
});

test('refuses an absent provider without searching unrelated source locations', () => {
  const findPackage = vi.fn(() => '');

  expect(() => resolveProvisioningCli('/caller', findPackage)).toThrow('Provisioning package unavailable');
  expect(findPackage).toHaveBeenCalledExactlyOnceWith('@nlabs/reaktor-provisioning', '/caller');
});

test.each(['resolve', 'run', 'invalid-status'])('reports sanitized %s failures once', async (mode) => {
  const write = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  const callback = vi.fn();
  const error = {code: 'ENOENT', message: 'PRIVATE_ARGUMENTS_AND_TOKEN'};
  const resolveCli = () => {
    if(mode === 'resolve') {
      throw error;
    }
    return '/private/provider.js';
  };
  const run = async () => {
    if(mode === 'run') {
      throw error;
    }
    return Number.NaN;
  };

  expect(await provision({operation: 'stack-update'}, callback, {resolveCli, run})).toBe(1);
  expect(callback).toHaveBeenCalledExactlyOnceWith(1);
  expect(write.mock.calls.flat().join('')).not.toMatch(/PRIVATE|private\/provider/);
});
