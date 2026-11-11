import {expect, test} from '@playwright/test';
import {spawnSync} from 'node:child_process';
import {mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const cli = fileURLToPath(new URL('../../../lib/lex.js', import.meta.url));

for(const operation of ['artifact-publish', 'stack-create', 'stack-update', 'cloudfront-api-routing', 'ui-publish']) {
  for(const forwarded of [[], ['--version'], ['-V'], ['--help'], ['--', '-V']]) {
    test(`compiled CLI forwards ${operation} ${forwarded.join(' ')} to the caller's hoisted provider`, () => {
      const root = realpathSync(mkdtempSync(join(tmpdir(), 'lex-provision-cli-')));
      try {
        const provider = join(root, 'node_modules/@nlabs/reaktor-provisioning');
        mkdirSync(join(provider, 'lib'), {recursive: true});
        mkdirSync(join(root, 'api'));
        writeFileSync(join(provider, 'package.json'), JSON.stringify({bin: {'reaktor-provisioning': './lib/cli.js'},
          name: '@nlabs/reaktor-provisioning', type: 'module', version: '1.1.4'}));
        writeFileSync(join(provider, 'lib/cli.js'),
          'process.stdout.write(JSON.stringify({args:process.argv.slice(2),cwd:process.cwd()}));process.exitCode=37;\n');
        const args = forwarded.length ? forwarded : ['--binding', 'private binding.json', '--mode', 'plan'];
        const result = spawnSync(process.execPath, [cli, 'provision', operation, ...args], {
          cwd: join(root, 'api'), encoding: 'utf8', env: {...process.env, LEX_CONFIG: undefined}
        });

        expect(result.status, result.stderr).toBe(37);
        expect(JSON.parse(result.stdout)).toEqual({args: [operation, ...args], cwd: join(root, 'api')});
      } finally {
        rmSync(root, {force: true, recursive: true});
      }
    });
  }
}

test('compiled CLI refuses an unsupported provider operation without launching it', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'lex-provision-refusal-')));
  try {
    const result = spawnSync(process.execPath, [cli, 'provision', 'lambda-update', '--private-value', 'TEST_ONLY'], {
      cwd: root, encoding: 'utf8', env: {...process.env, LEX_CONFIG: undefined}
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Unable to start node');
    expect(result.stderr).not.toContain('TEST_ONLY');
  } finally {
    rmSync(root, {force: true, recursive: true});
  }
});
