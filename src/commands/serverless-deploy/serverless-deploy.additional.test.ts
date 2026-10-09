import {execa} from 'execa';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {serverlessDeploy} from './serverless-deploy.js';

vi.mock('execa', () => ({
  execa: vi.fn(async () => {
    throw new Error('default runner fixture');
  })
}));
const roots: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for(const root of roots.splice(0)) {
    rmSync(root, {
      force: true, recursive: true
    });
  }
});

const fixture = () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'lex-package-options-')));
  roots.push(root);
  vi.spyOn(process, 'cwd').mockReturnValue(root);
  writeFileSync(join(root, 'entry.ts'), 'export const handler=()=>1;');
  return {
    options: {
      entry: 'entry.ts', output: 'out.zip', packageDir: 'stage', quiet: true
    }, root
  };
};

describe('packaging failure boundaries', () => {
  it('uses the default structured executor and treats spawn failure as failure', async () => {
    const {options} = fixture();

    expect(await serverlessDeploy(options)).toBe(1);
    expect(execa).toHaveBeenCalledWith('npx', expect.arrayContaining(['--no-install', 'esbuild']), expect.objectContaining({
      stdio: 'pipe'
    }));
  });

  it.each([2048, 2097152])('reports successful archive sizes (%i bytes)', async (size) => {
    const {options, root} = fixture();
    const run = vi.fn(async (command: string, args: readonly string[]) => {
      if(command === 'zip') {
        writeFileSync(args[1], Buffer.alloc(size));
      }
    });

    expect(await serverlessDeploy({
      ...options, quiet: false, smokeCommand: 'fixture'
    }, undefined, {
      run
    })).toBe(0);
    expect(run.mock.calls.map(([command]) => command)).toEqual(['npx', 'fixture', 'zip']);
    expect(readFileSync(join(root, 'out.zip')).length).toBe(size);
  });

  it('requires smokeCommand for smokeArgs and refuses directory entries and escaped output paths', async () => {
    const {options} = fixture();
    const run = vi.fn(async () => { });
    for(const patch of [{
      entry: '.'
    }, {
      smokeArgs: ['arg']
    }, {
      outfile: 'stage'
    }, {
      output: 'entry.ts'
    }, {
      packageDir: 'node_modules/new'
    }, {
      packageDir: '.git/work'
    }, {
      output: '.'
    }]) {
      // eslint-disable-next-line no-await-in-loop -- Cases deliberately share staging and the observed cwd.
      expect(await serverlessDeploy({
        ...options, ...patch
      }, undefined, {
        run
      })).toBe(1);
    }

    expect(run).not.toHaveBeenCalled();
  });

  it('rejects dot package traversal and source symlink overlap before staging removal', async () => {
    const {root, options} = fixture();
    mkdirSync(join(root, 'stage'));
    writeFileSync(join(root, 'stage/keep'), 'keep');
    mkdirSync(join(root, 'node_modules'));
    symlinkSync(root, join(root, 'node_modules/source'));
    const run = vi.fn(async () => { });
    for(const name of ['.', '..', 'source']) {
    // eslint-disable-next-line no-await-in-loop -- Each fixture owns the observed cwd and staging lifecycle.
      expect(await serverlessDeploy({
        ...options, copyNodeModule: name
      }, undefined, {
        run
      })).toBe(1);
    }

    expect(readFileSync(join(root, 'stage/keep'), 'utf8')).toBe('keep');
    expect(run).not.toHaveBeenCalled();
  });

  it('preserves a declared module root contained by staging before any subprocess', async () => {
    const {options, root} = fixture();
    const sentinel = join(root, 'stage/node_modules/sentinel');
    mkdirSync(join(root, 'stage/node_modules'), {recursive: true});
    writeFileSync(sentinel, 'module source must survive');
    const run = vi.fn(async () => {
      throw new Error('build must not execute');
    });

    expect(await serverlessDeploy({
      ...options, nodeModulesPath: 'stage/node_modules'
    }, undefined, {run})).toBe(1);
    expect(run).not.toHaveBeenCalled();
    expect(readFileSync(sentinel, 'utf8')).toBe('module source must survive');
  });

  it('removes a partial archive if zip fails without deleting staged source material', async () => {
    const {root, options} = fixture();
    const run = vi.fn(async (command: string, args: readonly string[]) => {
      if(command === 'zip') {
        writeFileSync(args[1], 'partial');
        throw new Error('zip failure');
      }
    });

    expect(await serverlessDeploy(options, undefined, {
      run
    })).toBe(1);
    expect(existsSync(join(root, 'out.zip'))).toBe(false);
    expect(existsSync(join(root, 'entry.ts'))).toBe(true);
  });
});
