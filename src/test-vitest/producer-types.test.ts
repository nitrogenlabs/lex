import {spawnSync} from 'node:child_process';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, join, resolve} from 'node:path';

const require = createRequire(import.meta.url);
const owner = resolve(dirname(require.resolve('vitest/package.json')), '../..');
const compiler = join(dirname(require.resolve('typescript/package.json')), 'bin/tsc');
const declaration = join(owner, 'src/vitest.d.ts');
const positive = `import {vi} from 'vitest';
type IsAny<T> = 0 extends (1 & T) ? true : false;
type AssertFalse<T extends false> = T;
export type BareIsTyped = AssertFalse<IsAny<SpyInstance>>;
const object = {format: (value: number): string => String(value)};
const bare: SpyInstance = vi.spyOn(object, 'format');
bare.mockRestore();
const precise: SpyInstance<(value: number) => string> = vi.spyOn(object, 'format');
precise.mockImplementation((value) => {const number: number = value; return String(number);});
precise.mockReturnValue('ok');
const calls: Array<[value: number]> = precise.mock.calls;
const log: SpyInstance<typeof console.log> = vi.spyOn(console, 'log');
const error: SpyInstance<typeof console.error> = vi.spyOn(console, 'error');
const chdir: SpyInstance<typeof process.chdir> = vi.spyOn(process, 'chdir');
const observeExit = () => vi.spyOn(process, 'exit');
declare const exit: ReturnType<typeof observeExit>;
const exactExit: SpyInstance<typeof process.exit> = exit;
void [calls, log, error, chdir, exactExit];
`;
const negative = `import {vi} from 'vitest';
const object = {format: (value: number): string => String(value)};
const precise: SpyInstance<(value: number) => string> = vi.spyOn(object, 'format');
precise.mockImplementation((value) => {const invalid: string = value; return invalid;});
precise.mockReturnValue(7);
precise.mockImplementation(() => 7);
precise.inventedMethod();
`;

describe.each([
  {module: 'NodeNext', moduleResolution: 'NodeNext'},
  {module: 'ESNext', moduleResolution: 'Bundler'}
])('producer spy compatibility in $moduleResolution', ({module, moduleResolution}) => {
  const compile = (source: string) => {
    const fixture = mkdtempSync(join(owner, '.lex-producer-types-'));

    try {
      const input = join(fixture, 'contract.ts');
      writeFileSync(input, source);
      const result = spawnSync(process.execPath, [
        compiler, '--ignoreConfig', '--noEmit', '--strict', '--skipLibCheck', 'false',
        '--target', 'ESNext', '--module', module, '--moduleResolution', moduleResolution,
        '--types', 'node', '--pretty', 'false', declaration, input
      ], {cwd: owner, encoding: 'utf8'});

      expect(result.error).toBeUndefined();

      return {output: `${result.stdout}${result.stderr}`, status: result.status};
    } finally {
      rmSync(fixture, {force: true, recursive: true});
    }
  };

  it('keeps the real producer alias typed with public Vitest method contracts', () => {
    const result = compile(positive);

    expect(result.output).toBe('');
    expect(result.status).toBe(0);
  });

  it('rejects each wrong callback, return and invented method at its intended site', () => {
    const result = compile(negative);
    const diagnostics = [...result.output.matchAll(/contract\.ts\((\d+),\d+\): error TS(\d+):/g)]
      .map((match) => [Number(match[1]), Number(match[2])]);

    expect(result.status).toBe(1);
    expect(result.output).not.toMatch(/TS(?:2307|2688|2694|2792|2882|7016)/);
    expect(diagnostics).toEqual([[4, 2322], [5, 2345], [6, 2322], [7, 2339]]);
    expect(result.output.match(/error TS/g)).toHaveLength(4);
  });
});
