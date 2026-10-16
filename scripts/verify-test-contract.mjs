import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, join, resolve} from 'node:path';

// Run only after installing the immutable archive into the disposable fixture.
const fixture = resolve(process.argv[2]);
const evidence = resolve(process.argv[3]);
mkdirSync(evidence, {recursive: true});
const require = createRequire(join(fixture, 'package.json'));
const findBin = (name) => {
  let current = fixture;
  while(current !== dirname(current)) {
    const binary = join(current, 'node_modules', '.bin', name);
    if(existsSync(binary)) return binary;
    current = dirname(current);
  }
  throw new Error(`Missing installed ${name} binary`);
};
const lex = findBin('lex');
const tsc = findBin('tsc');
const results = [];
const run = (name, binary, args, expected = 0, cwd = fixture) => {
  const result = spawnSync(binary, args, {cwd, encoding: 'utf8', env: process.env});
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  writeFileSync(join(evidence, `${name}.log`), output);
  results.push({args, binary, cwd, name, status: result.status});
  writeFileSync(join(evidence, 'commands.json'), JSON.stringify(results, null, 2));
  assert.equal(result.error, undefined, name);
  if(expected === 0) assert.equal(result.status, 0, `${name}\n${output}`);
  else assert.notEqual(result.status, 0, `${name} unexpectedly passed`);
  return output;
};

// Use the public root solely as a package-location anchor; do not execute the CLI entry.
const lexRequire = createRequire(require.resolve('@nlabs/lex'));
const graph = {};
for(const name of ['vitest', '@vitest/coverage-v8', 'typescript', '@testing-library/jest-dom']) {
  const path = lexRequire.resolve(`${name}/package.json`);
  graph[name] = {path, version: JSON.parse(readFileSync(path, 'utf8')).version};
}
try {graph.bareVitest = require.resolve('vitest');} catch(error) {graph.bareVitest = error.code;}
graph.consumerCompiler = JSON.parse(readFileSync(require.resolve('typescript/package.json'), 'utf8')).version;
writeFileSync(join(evidence, 'graph.json'), JSON.stringify(graph, null, 2));
assert.equal(graph.vitest.version, graph['@vitest/coverage-v8'].version);

run('types-nodenext', tsc, ['-p', 'tsconfig.json']);
run('types-bundler', tsc, ['-p', 'tsconfig.json', '--module', 'ESNext', '--moduleResolution', 'Bundler']);
const invalid = run('types-negative', tsc, [
  '--ignoreConfig', '--noEmit', '--strict', '--skipLibCheck', 'false', '--target', 'ESNext',
  '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--types', 'node', 'types.negative.ts'
], 1);
assert.match(invalid, /TS2322/);
assert.match(invalid, /TS2345/);
assert.match(invalid, /TS2339/);
run('runtime-coverage', lex, ['test', '--config', './vitest.config.mjs']);
const coverage = JSON.parse(readFileSync(join(fixture, 'coverage/coverage-summary.json'), 'utf8')).total;
for(const key of ['branches', 'functions', 'lines', 'statements']) assert.equal(coverage[key].pct, 100);

for(const [name, expected] of [['hoist', /expected 'real' to be 'hoisted'/], ['matcher', /Invalid Chai property/]]) {
  const config = `${name}.negative.config.mjs`;
  writeFileSync(join(fixture, config), `export default {test:{globals:true,include:['${name}.negative.ts']}};\n`);
  assert.match(run(`runtime-${name}-negative`, lex, ['test', '--config', `./${config}`], 1), expected);
}

// Inline the public package so Vite observes its imports; exercise the guard itself below.
const leanConfig = (file) => `export default {
  plugins: [{name:'contract-import-boundary',enforce:'pre',resolveId(specifier) {
    if(/^(react(?:-dom)?(?:\\/|$)|@testing-library\\/|@nlabs\\/lex$)/.test(specifier)) {
      throw new Error('Node test facade imported presentation or CLI module: ' + specifier);
    }
  }}],
  test:{globals:true,include:['${file}'],server:{deps:{inline:[/@nlabs\\/lex/]}}}
};\n`;
writeFileSync(join(fixture, 'lean.config.mjs'), leanConfig('core.test.ts'));
run('runtime-lean', lex, ['test', '--config', './lean.config.mjs']);
writeFileSync(join(fixture, 'lean.negative.ts'), "import 'react';\ntest('presentation import control', () => {});\n");
writeFileSync(join(fixture, 'lean.negative.config.mjs'), leanConfig('lean.negative.ts'));
assert.match(run('runtime-lean-negative', lex, ['test', '--config', './lean.negative.config.mjs'], 1), /Node test facade imported presentation or CLI module/);
writeFileSync(join(fixture, 'globals.config.mjs'), "export default {test:{globals:false,include:['globals-runtime.test.ts']}};\n");
run('runtime-globals-no-setup', lex, ['test', '--config', './globals.config.mjs']);

const generated = join(fixture, 'generated');
mkdirSync(join(generated, 'src'), {recursive: true});
copyFileSync(join(fixture, 'package.json'), join(generated, 'package.json'));
copyFileSync(join(fixture, 'subject.ts'), join(generated, 'src/subject.ts'));
writeFileSync(join(generated, 'src/contract.ts'), "import type {Mock} from '@nlabs/lex/test-vitest';\nconst mock: Mock<() => number> = vi.fn(() => 7);\ntest('generated globals', () => expect(mock()).toBe(7));\n");
run('template-create', lex, ['create', 'tsconfig'], 0, generated);
run('template-compile', tsc, ['-p', 'tsconfig.json', '--skipLibCheck', 'false', '--strict', 'true'], 0, generated);
assert.ok(existsSync(join(generated, 'src/subject.d.ts')));
assert.ok(!existsSync(join(generated, 'src/subject.js')));
assert.ok(existsSync(join(generated, 'src/contract.d.ts')));
writeFileSync(join(evidence, 'result.json'), JSON.stringify({coverage, graph, results, status: 'passed'}, null, 2));
process.stdout.write(`Passed ${results.length} installed-contract commands\n`);
