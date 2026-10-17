import {mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {lint} from './lint.js';

import type {LintCallback} from './lint.js';

const state = vi.hoisted(() => ({checkTypes: vi.fn(), config: {ai: {provider: 'none'}, eslint: {}}}));
vi.mock('../../LexConfig.js', () => ({LexConfig: {checkLintTypescriptConfig: state.checkTypes, config: state.config}}));
vi.mock('../../utils/app.js', () => ({createSpinner: () => ({fail: vi.fn(), start: vi.fn(), succeed: vi.fn()})}));
vi.mock('../../utils/log.js', () => ({log: vi.fn()}));
vi.mock('../../utils/file.js', async () => {
  const {createRequire} = await import('node:module');
  const {dirname, join} = await import('node:path');
  const require = createRequire(import.meta.url);
  return {resolveBinaryPath: () => join(dirname(require.resolve('eslint/package.json')), 'bin/eslint.js')};
});

const require = createRequire(import.meta.url);
const modules = resolve(dirname(require.resolve('eslint/package.json')), '..');
let cwd: string;
let fixture: string;
const callback = vi.fn<LintCallback>();

beforeEach(() => {
  cwd = process.cwd();
  fixture = mkdtempSync(join(tmpdir(), 'lex-lint-contract-'));
  mkdirSync(join(fixture, 'src'));
  symlinkSync(modules, join(fixture, 'node_modules'), 'dir');
  writeFileSync(join(fixture, 'package.json'), '{"type":"module"}');
  writeFileSync(join(fixture, 'eslint.config.mjs'), 'export default [{rules:{semi:[\'error\',\'always\']}}];');
  writeFileSync(join(fixture, 'src/input.js'), 'const sample = 1\n');
  process.chdir(fixture);
  vi.clearAllMocks();
});

afterEach(() => {
  process.chdir(cwd);
  rmSync(fixture, {force: true, recursive: true});
});

describe('real ESLint lint option contracts', () => {
  it('limits built-in fixes by metadata category while unrestricted lint fixes both categories', async () => {
    writeFileSync(join(fixture, 'eslint.config.mjs'), 'export default [{rules:{semi:["error","always"],"object-shorthand":["error","always"]}}];');
    writeFileSync(join(fixture, 'src/input.js'), 'const value = 1\nconst sample = {value: value}\n');

    expect(await lint({fixType: 'layout'}, callback)).toBe(1);
    expect(readFileSync(join(fixture, 'src/input.js'), 'utf8')).toBe('const value = 1;\nconst sample = {value: value};\n');
    expect(await lint({}, callback)).toBe(0);
    expect(readFileSync(join(fixture, 'src/input.js'), 'utf8')).toBe('const value = 1;\nconst sample = {value};\n');
  });

  it('dry-runs only the chosen category and preserves source/config/cache bytes', async () => {
    writeFileSync(join(fixture, 'eslint.config.mjs'), 'export default [{rules:{semi:["error","always"],"object-shorthand":["error","always"]}}];');
    writeFileSync(join(fixture, 'src/input.js'), 'const value = 1\nconst sample = {value: value}\n');
    writeFileSync(join(fixture, 'tsconfig.json'), '{}');
    writeFileSync(join(fixture, '.eslintrc.json'), '{"preserved":true}');
    writeFileSync(join(fixture, '.eslintcache'), 'caller-cache');
    const paths = ['src/input.js', 'eslint.config.mjs', 'package.json', 'tsconfig.json', '.eslintrc.json', '.eslintcache'];
    const before = paths.map((path) => readFileSync(join(fixture, path)));
    const output = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      expect(await lint({fixDryRun: true, fixType: 'layout'}, callback)).toBe(1);
      expect(JSON.stringify(output.mock.calls)).toContain('object-shorthand');
      expect(JSON.stringify(output.mock.calls)).not.toContain('Missing semicolon');
      expect(paths.map((path) => readFileSync(join(fixture, path)))).toEqual(before);
      expect(state.checkTypes).not.toHaveBeenCalled();
      expect(await lint({fixDryRun: true, fixType: 'layout,suggestion'}, callback)).toBe(0);
      expect(paths.map((path) => readFileSync(join(fixture, path)))).toEqual(before);
    } finally {
      output.mockRestore();
    }
  });

  it('overrides one rule in check diagnostics without disabling unrelated rules or writing bytes', async () => {
    writeFileSync(join(fixture, 'eslint.config.mjs'), 'export default [{rules:{semi:["error","always"],"no-unused-vars":"error"}}];');
    writeFileSync(join(fixture, '.eslintcache'), 'caller-cache');
    const paths = ['src/input.js', 'eslint.config.mjs', 'package.json', '.eslintcache'];
    const before = paths.map((path) => readFileSync(join(fixture, path)));
    const output = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      expect(await lint({check: true, rule: 'semi: off'}, callback)).toBe(1);
      expect(JSON.stringify(output.mock.calls)).toContain('no-unused-vars');
      expect(JSON.stringify(output.mock.calls)).not.toContain('Missing semicolon');
      expect(paths.map((path) => readFileSync(join(fixture, path)))).toEqual(before);
      expect(await lint({check: true, rule: 'semi: off, no-unused-vars: off'}, callback)).toBe(0);
      expect(paths.map((path) => readFileSync(join(fixture, path)))).toEqual(before);
    } finally {
      output.mockRestore();
    }
  });

  it.each([{fixType: 'not-a-category'}, {rule: 'missing-rule: error'}, {rule: 'semi: [invalid]'}])('fails invalid ESLint options instead of dropping them %j', async (options) => {
    expect(await lint({...options, fixDryRun: true}, callback)).toBe(1);
    expect(readFileSync(join(fixture, 'src/input.js'), 'utf8')).toBe('const sample = 1\n');
  });

  it('check reports fixable original violations and leaves every source/config byte unchanged', async () => {
    writeFileSync(join(fixture, 'tsconfig.json'), '{}');
    writeFileSync(join(fixture, '.eslintrc.json'), '{"preserved":true}');
    writeFileSync(join(fixture, '.eslintcache'), 'caller-cache');
    const paths = ['.eslintcache', 'src/input.js', 'package.json', 'eslint.config.mjs', 'tsconfig.json', '.eslintrc.json'];
    const before = paths.map((path) => readFileSync(join(fixture, path)));

    expect(await lint({check: true}, callback)).toBe(1);
    expect(callback).toHaveBeenLastCalledWith(1);
    expect(state.checkTypes).not.toHaveBeenCalled();
    expect(paths.map((path) => readFileSync(join(fixture, path)))).toEqual(before);

    writeFileSync(join(fixture, 'src/input.js'), 'const sample = 1;\n');

    expect(await lint({check: true}, callback)).toBe(0);
  });

  it.each([{fix: true}, {removeComments: true}, {fixDryRun: true}])('rejects incompatible check options %j', async (options) => {
    expect(await lint({...options, check: true}, callback)).toBe(1);
    expect(readFileSync(join(fixture, 'src/input.js'), 'utf8')).toBe('const sample = 1\n');
    expect(state.checkTypes).not.toHaveBeenCalled();
  });

  it('dry-runs fixes without changing source or deleting legacy config', async () => {
    const original = readFileSync(join(fixture, 'src/input.js'));
    writeFileSync(join(fixture, '.eslintcache'), 'caller-cache');
    writeFileSync(join(fixture, '.eslintrc.json'), '{"preserved":true}');

    expect(await lint({fixDryRun: true}, callback)).toBe(0);
    expect(readFileSync(join(fixture, '.eslintcache'), 'utf8')).toBe('caller-cache');
    expect(readFileSync(join(fixture, 'src/input.js'))).toEqual(original);
    expect(readFileSync(join(fixture, '.eslintrc.json'), 'utf8')).toBe('{"preserved":true}');
  });

  it('uses explicit configuration instead of the default project configuration', async () => {
    writeFileSync(join(fixture, 'custom config.mjs'), 'export default [{rules:{\'no-restricted-syntax\':[\'error\',\'VariableDeclaration\']}}];');

    expect(await lint({config: 'custom config.mjs', fixDryRun: true}, callback)).toBe(1);
  });

  it('fails when actual warnings exceed the requested limit', async () => {
    writeFileSync(join(fixture, 'warnings.mjs'), 'export default [{rules:{\'no-unused-vars\':\'warn\'}}];');

    expect(await lint({config: 'warnings.mjs', fixDryRun: true, maxWarnings: '0'}, callback)).toBe(1);
    expect(await lint({config: 'warnings.mjs', fixDryRun: true, maxWarnings: '1'}, callback)).toBe(0);
  });

  it('applies warning limits to the aggregate JavaScript and TypeScript files', async () => {
    writeFileSync(join(fixture, 'tsconfig.json'), '{}');
    writeFileSync(join(fixture, 'src/input.ts'), 'const typedSample = 1;');
    writeFileSync(join(fixture, 'mixed.mjs'), 'export default [{files:[\'**/*.{js,ts}\'],rules:{\'no-unused-vars\':\'warn\'}}];');

    expect(await lint({config: 'mixed.mjs', fixDryRun: true, maxWarnings: '1'}, callback)).toBe(1);
  });

  it.each([{fix: true}, {removeComments: true}])('rejects incompatible mutation options before dry-run work %j', async (options) => {
    const original = readFileSync(join(fixture, 'src/input.js'));

    expect(await lint({...options, fixDryRun: true}, callback)).toBe(1);
    expect(readFileSync(join(fixture, 'src/input.js'))).toEqual(original);
    expect(state.checkTypes).not.toHaveBeenCalled();
  });

  it('does not create TypeScript lint config or remove caller-owned temporary configs in dry-run', async () => {
    writeFileSync(join(fixture, 'tsconfig.json'), '{}');
    writeFileSync(join(fixture, '.lex-temp-eslint.cjs'), 'caller-owned');

    expect(await lint({fixDryRun: true}, callback)).toBe(0);
    expect(state.checkTypes).not.toHaveBeenCalled();
    expect(readFileSync(join(fixture, '.lex-temp-eslint.cjs'), 'utf8')).toBe('caller-owned');
  });

  it('preserves historical built-in autofix without the AI flag', async () => {
    expect(await lint({}, callback)).toBe(0);
    expect(readFileSync(join(fixture, 'src/input.js'), 'utf8')).toContain(';');
  });

  it('warns and falls back for a nonexistent explicit configuration', async () => {
    expect(await lint({config: 'missing.mjs', fixDryRun: true}, callback)).toBe(0);
  });
});
