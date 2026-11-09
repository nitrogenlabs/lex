import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

const [fixture, evidence] = process.argv.slice(2);
assert.ok(path.isAbsolute(fixture ?? '') && path.isAbsolute(evidence ?? ''), 'Absolute fixture and evidence paths required');
await mkdir(evidence, {recursive: true});
const commands = [];
const run = (label, args, expected = 0) => {
  const result = spawnSync(process.execPath, args, {cwd: fixture, encoding: 'utf8', env: {...process.env, CI: 'true'}});
  if(result.error) throw new Error(`Qualification command failed (${result.error.code ?? 'UNKNOWN'})`);
  commands.push({exit: result.status, label, stderr: result.stderr, stdout: result.stdout});
  writeFileSync(path.join(evidence, `${label}.json`), JSON.stringify(commands.at(-1), null, 2));
  assert.equal(result.status, expected, `${label} failed`);
  return result;
};
const binaries = run('resolve-public-binaries', ['--input-type=module', '-e', `
import {resolveBinaryPath} from '@nlabs/lex';
console.log(JSON.stringify({compiler:resolveBinaryPath('tsc','typescript'),cli:resolveBinaryPath('lex','@nlabs/lex')}));
`]);
const {compiler, cli} = JSON.parse(binaries.stdout);
const base = JSON.parse(await readFile(path.join(fixture, 'tsconfig.json'), 'utf8'));
for(const [mode, module, moduleResolution] of [['node', 'NodeNext', 'NodeNext'], ['bundler', 'ESNext', 'Bundler']]) {
  const config = `tsconfig.${mode}.json`;
  await writeFile(path.join(fixture, config), JSON.stringify({...base,
    compilerOptions: {...base.compilerOptions, module, moduleResolution}}, null, 2));
  run(`${mode}-public-types`, [compiler, '--project', config]);
}
const negative = (await readFile(path.join(fixture, 'types.negative.ts'), 'utf8')).replace(/^.*@ts-expect-error.*\n/gm, '');
await writeFile(path.join(fixture, 'negative-unassisted.ts'), negative);
await writeFile(path.join(fixture, 'tsconfig.negative.json'), JSON.stringify({...base, include: ['negative-unassisted.ts']}));
const failure = run('negative-public-types', [compiler, '--project', 'tsconfig.negative.json'], 1);
assert.match(failure.stdout, /TS2322/);
assert.match(failure.stdout, /TS2339/);
run('public-playwright-runner', [cli, 'test', '--e2e', '--e2eConfig', 'playwright.config.ts']);
await writeFile(path.join(evidence, 'commands.json'), JSON.stringify(commands, null, 2));
console.log('Public Playwright NodeNext/Bundler, negative types and installed Lex runner passed.');
