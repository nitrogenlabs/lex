import {spawnSync} from 'node:child_process';
import {existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const cli = join(root, 'lib/lex.js');
const fixtures: string[] = [];

const fixture = (source: string, noEmitOnError = true): string => {
  const cwd = mkdtempSync(join(tmpdir(), 'lex-compile-process-'));
  fixtures.push(cwd);
  mkdirSync(join(cwd, 'src'));
  writeFileSync(join(cwd, 'package.json'), JSON.stringify({type: 'module'}));
  writeFileSync(join(cwd, 'src/index.ts'), source);
  writeFileSync(join(cwd, 'tsconfig.build.json'), JSON.stringify({
    compilerOptions: {declaration: true, module: 'NodeNext', moduleResolution: 'NodeNext', noEmitOnError, outDir: './lib', rootDir: './src', types: []},
    include: ['src/**/*.ts']
  }));
  return cwd;
};

const run = (cwd: string, args: string[] = [], imports: string[] = []) => spawnSync(process.execPath, [
  ...imports.flatMap((path) => ['--import', path]), cli, 'compile', '--sourcePath', 'src', '--outputPath', 'lib', ...args
], {cwd, encoding: 'utf8', env: {...process.env}, timeout: 30000});

const toolOverride = (cwd: string, binary: string, replacement: string | null): string => {
  const original = pathToFileURL(join(root, 'lib/utils/file.js')).href;
  const loader = join(cwd, 'tool-override.mjs');
  writeFileSync(loader, `import {registerHooks} from 'node:module';
registerHooks({load(url, context, nextLoad) {
  if (url !== ${JSON.stringify(original)}) return nextLoad(url, context);
  return {format: 'module', shortCircuit: true, source: ${JSON.stringify(
    `export * from '${original}?original';\nimport * as original from '${original}?original';\nexport const resolveBinaryPath = (name, pkg) => name === ${JSON.stringify(binary)} ? ${JSON.stringify(replacement)} : original.resolveBinaryPath(name, pkg);`
  )}};
}});`);
  return loader;
};

afterEach(() => {
  for(const cwd of fixtures.splice(0)) {
    rmSync(cwd, {force: true, recursive: true});
  }
});

describe('built compile CLI process contract', () => {
  it.each([true, false])('fails type errors without later JS/assets, noEmitOnError=%s', (noEmitOnError) => {
    const cwd = fixture('export const answer: string = 42;', noEmitOnError);
    writeFileSync(join(cwd, 'src/notes.md'), 'must not be copied');
    const result = run(cwd, ['--typescript']);

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain('TS2322');
    expect(`${result.stdout}${result.stderr}`).not.toContain('Compile completed successfully');
    expect(existsSync(join(cwd, 'lib/index.js'))).toBe(false);
    expect(existsSync(join(cwd, 'lib/notes.md'))).toBe(false);
    expect(existsSync(join(cwd, 'lib/index.d.ts'))).toBe(!noEmitOnError);
  });

  it('compiles valid TypeScript and emits declarations', () => {
    const cwd = fixture('export const answer: number = 42;');
    const result = run(cwd, ['--typescript']);

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(readFileSync(join(cwd, 'lib/index.d.ts'), 'utf8')).toContain('answer: number');
    expect(readFileSync(join(cwd, 'lib/index.js'), 'utf8')).toContain('42');
  });

  it('preserves ordinary JavaScript compilation', () => {
    const cwd = fixture('');
    rmSync(join(cwd, 'src/index.ts'));
    writeFileSync(join(cwd, 'src/index.js'), 'export const answer = 42;');
    const result = run(cwd);

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(readFileSync(join(cwd, 'lib/index.js'), 'utf8')).toContain('42');
    expect(existsSync(join(cwd, 'lib/index.d.ts'))).toBe(false);
  });

  it.each(['tsc', 'postcss'])('fails when %s cannot be resolved', (binary) => {
    const cwd = fixture('export const answer = 42;');
    if(binary === 'postcss') {
      writeFileSync(join(cwd, 'src/style.css'), 'body {color: red}');
    }
    const loader = toolOverride(cwd, binary, null);
    const result = run(cwd, binary === 'tsc' ? ['--typescript'] : [], [loader]);

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(existsSync(join(cwd, 'lib/index.js'))).toBe(false);
  });

  it.each(['tsc', 'postcss'])('sanitizes missing %s executable launch', (binary) => {
    const cwd = fixture('export const answer = 42;');
    if(binary === 'postcss') {
      writeFileSync(join(cwd, 'src/style.css'), 'body {color: red}');
    }
    const loader = toolOverride(cwd, binary, join(cwd, 'SENTINEL-secret-executable'));
    const result = run(cwd, binary === 'tsc' ? ['--typescript'] : [], [loader]);

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain('ENOENT');
    expect(`${result.stdout}${result.stderr}`).not.toContain('SENTINEL');
    expect(existsSync(join(cwd, 'lib/index.js'))).toBe(false);
  });

  it('fails when the declaration compiler is terminated', () => {
    const cwd = fixture('export const answer = 42;');
    const executable = join(cwd, 'terminated-tsc');
    writeFileSync(executable, `#!${process.execPath}\nprocess.kill(process.pid, 'SIGTERM');\n`, {mode: 0o755});
    const result = run(cwd, ['--typescript'], [toolOverride(cwd, 'tsc', executable)]);

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(existsSync(join(cwd, 'lib/index.js'))).toBe(false);
  });
});
