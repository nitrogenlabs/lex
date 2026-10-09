import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync, realpathSync, symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {serverlessDeploy} from './serverless-deploy.js';

vi.mock('execa', () => ({
  execa: vi.fn(async () => {
    throw new Error('Unexpected real subprocess');
  })
}));
const roots: string[] = [];

afterEach(() => {
  for(const root of roots.splice(0)) {
    rmSync(root, {
      force: true, recursive: true
    });
  }
  vi.restoreAllMocks();
});

const fixture = () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'lex-package-')));
  roots.push(root);
  vi.spyOn(process, 'cwd').mockReturnValue(root);
  const entry = join(root, 'src/entry.ts');
  mkdirSync(dirname(entry), {
    recursive: true
  });
  writeFileSync(entry, 'export const handler = () => 1;');
  mkdirSync(join(root, 'node_modules/runtime'), {
    recursive: true
  });
  writeFileSync(join(root, 'node_modules/runtime/package.json'), JSON.stringify({
    name: 'runtime', version: '1.2.3'
  }));
  writeFileSync(join(root, 'package.json'), '{}');
  writeFileSync(join(root, 'package-lock.json'), JSON.stringify({
    lockfileVersion: 3, packages: {
      '': {}, 'node_modules/runtime': {
        integrity: 'sha512-fixture', resolved: 'https://registry.npmjs.org/runtime/-/runtime-1.2.3.tgz', version: '1.2.3'
      }
    }
  }));
  const options = {
    entry, output: join(root, 'lambda.zip'), packageDir: join(root, 'stage'), quiet: true
  };
  const calls: Array<{
    command: string;
    args: readonly string[];
    options: {
      cwd: string;
      env?: NodeJS.ProcessEnv;
      stdio: string;
    };
  }> = [];
  const run = vi.fn(async (command: string, args: readonly string[], opts: {
    cwd: string;
    env?: NodeJS.ProcessEnv;
    stdio: string;
  }) => {
    calls.push({
      args, command, options: opts
    });
    if(command === 'npx') {
      writeFileSync(args.find((arg) => arg.startsWith('--outfile='))!.slice('--outfile='.length), 'exports.handler = () => 1;');
    }
    if(command === 'zip') {
      writeFileSync(args[1], 'synthetic archive');
    }
  });
  const dependencies = {
    hostArchitecture: 'x64' as const, hostPlatform: 'linux' as const, run
  };
  const runtime = {
    runtimeArchitecture: 'x64' as const, runtimeContext: join(root, 'package.json'), runtimeDependencies: ['runtime'], runtimeLockfile: join(root, 'package-lock.json'), runtimePlatform: 'linux' as const, smokeArgs: ['smoke.js', 'literal ; $VALUE'], smokeCommand: 'node'
  };
  return {
    calls, dependencies, options, root, runtime
  };
};

describe('serverless package assembly', () => {
  it('keeps legacy build options and module copy while creating only final archive after build', async () => {
    const f = fixture();
    const callback = vi.fn();

    expect(await serverlessDeploy({
      ...f.options, bundle: false, copyNodeModule: ['runtime', 'missing'], external: 'graphql', format: 'esm', minify: true, nodeModulesPath: join(f.root, 'node_modules'), sourcemap: true
    }, callback, f.dependencies)).toBe(0);
    expect(f.calls.map((call) => call.command)).toEqual(['npx', 'zip']);
    expect(f.calls[0].args).toContain('--bundle=false');
    expect(f.calls[0].args).toContain('--format=esm');
    expect(f.calls[0].args).toContain('--minify');
    expect(f.calls[0].args).toContain('--sourcemap');
    expect(f.calls[0].args).toContain('--external:graphql');
    expect(JSON.parse(readFileSync(join(f.options.packageDir, 'node_modules/runtime/package.json'), 'utf8')).version).toBe('1.2.3');
    expect(callback).toHaveBeenCalledWith(0);
  });

  it('stages exact lock, passes explicit native OS/CPU and smokes before ZIP without mutating source lock', async () => {
    const f = fixture();
    const before = readFileSync(f.runtime.runtimeLockfile, 'utf8');

    expect(await serverlessDeploy({
      ...f.options, ...f.runtime
    }, undefined, f.dependencies)).toBe(0);
    expect(f.calls.map((call) => call.command)).toEqual(['npx', 'npm', 'node', 'zip']);
    expect(f.calls[1].args).toEqual(['ci', '--omit=dev', '--include=optional', '--ignore-scripts', '--workspaces=false', '--os=linux', '--cpu=x64']);
    expect(f.calls[1].options.cwd).toBe(f.options.packageDir);
    expect(f.calls[1].options.env?.npm_config_arch).toBe('x64');
    expect(f.calls[2].args).toEqual(['smoke.js', 'literal ; $VALUE']);
    expect(f.calls[2].options.stdio).toBe('pipe');
    expect(JSON.parse(readFileSync(join(f.options.packageDir, 'package.json'), 'utf8')).dependencies).toEqual({
      runtime: '1.2.3'
    });
    expect(JSON.parse(readFileSync(join(f.options.packageDir, 'package-lock.json'), 'utf8')).packages['node_modules/runtime'].integrity).toBe('sha512-fixture');
    expect(readFileSync(f.runtime.runtimeLockfile, 'utf8')).toBe(before);
  });

  it('keeps runtime dependencies external and matches ESM runtime package interpretation', async () => {
    const f = fixture();

    expect(await serverlessDeploy({
      ...f.options, ...f.runtime, format: 'esm'
    }, undefined, f.dependencies)).toBe(0);
    expect(f.calls[0].args).toContain('--external:runtime');
    expect(f.calls[0].args).toContain('--external:runtime/*');
    expect(JSON.parse(readFileSync(join(f.options.packageDir, 'package.json'), 'utf8')).type).toBe('module');
  });

  it.each(['npx', 'npm', 'node', 'zip'])('fails closed and suppresses subprocess credential output on %s failure', async (command) => {
    const f = fixture();
    const delegate = f.dependencies.run;
    f.dependencies.run = vi.fn(async (...args) => {
      if(args[0] === command) {
        throw new Error('credential-marker');
      }
      return delegate(...args);
    });
    const spy = vi.spyOn(console, 'log').mockImplementation(() => { });
    const error = vi.spyOn(console, 'error').mockImplementation(() => { });

    expect(await serverlessDeploy({
      ...f.options, ...f.runtime
    }, undefined, f.dependencies)).toBe(1);
    expect([...spy.mock.calls, ...error.mock.calls].flat().join(' ')).not.toContain('credential-marker');
    expect(existsSync(f.options.output)).toBe(false);

    if(command !== 'zip') {
      expect(f.calls.some((call) => call.command === 'zip')).toBe(false);
    }
  });

  it('rejects host mismatch and incomplete runtime options before any mutation or invocation', async () => {
    for(const patch of [{
      runtimePlatform: 'darwin'
    }, {
      runtimeArchitecture: 'arm64'
    }, {
      runtimeContext: undefined
    }, {
      runtimeLockfile: undefined
    }, {
      smokeCommand: undefined
    }, {
      runtimePlatform: undefined
    }, {
      runtimeArchitecture: undefined
    }]) {
      const f = fixture();
      mkdirSync(f.options.packageDir);
      writeFileSync(join(f.options.packageDir, 'keep'), 'keep');

      const invalidOptions = {...f.options, ...f.runtime, ...patch};

      // eslint-disable-next-line no-await-in-loop -- Each fixture owns the observed cwd and staging lifecycle.
      expect(await serverlessDeploy(invalidOptions as never, undefined, f.dependencies)).toBe(1);
      expect(f.calls).toEqual([]);
      expect(readFileSync(join(f.options.packageDir, 'keep'), 'utf8')).toBe('keep');
    }
  });

  it('rejects destructive staging/output/entry aliases and copy traversal before touching sources', async () => {
    const f = fixture();
    const patches = [{
      packageDir: f.root
    }, {
      packageDir: dirname(f.options.entry)
    }, {
      output: f.options.entry
    }, {
      output: join(f.options.packageDir, 'inside.zip')
    }, {
      outfile: join(f.root, 'outside.js')
    }, {
      copyNodeModule: '../src'
    }, {
      packageDir: join(f.root, 'node_modules/runtime')
    }];
    for(const patch of patches) {
    // eslint-disable-next-line no-await-in-loop -- Each fixture owns the observed cwd and staging lifecycle.
      expect(await serverlessDeploy({
        ...f.options, ...patch
      }, undefined, f.dependencies)).toBe(1);
    }

    expect(f.calls).toEqual([]);
    expect(existsSync(f.options.entry)).toBe(true);

    symlinkSync(dirname(f.options.entry), join(f.root, 'alias'));

    expect(await serverlessDeploy({
      ...f.options, packageDir: join(f.root, 'alias')
    }, undefined, f.dependencies)).toBe(1);
    expect(existsSync(f.options.entry)).toBe(true);
  });

  it('reports missing entry and missing source without executing anything', async () => {
    const f = fixture();

    expect(await serverlessDeploy({}, undefined, f.dependencies)).toBe(1);
    expect(await serverlessDeploy({
      ...f.options, entry: join(f.root, 'missing')
    }, undefined, f.dependencies)).toBe(1);
    expect(f.calls).toEqual([]);
  });
});
