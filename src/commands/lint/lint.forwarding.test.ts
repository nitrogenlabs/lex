import {readFileSync, unlinkSync, writeFileSync} from 'fs';
import {basename} from 'node:path';
import {beforeEach, describe, expect, it, vi} from 'vitest';

import {log} from '../../utils/log.js';
import {lint} from './lint.js';

import type {LintCallback} from './lint.js';

type CommandRunner = (command: string, args: string[], options: Record<string, unknown>) =>
Promise<{code?: string; exitCode?: number; failed?: boolean; stderr: string; stdout: string}>;

const state = vi.hoisted(() => ({config: {ai: {provider: 'none'}, eslint: {}}, missingBinary: false, noProject: false, run: vi.fn<CommandRunner>()}));
vi.mock('execa', () => ({execa: state.run}));
vi.mock('../../LexConfig.js', () => ({LexConfig: {checkLintTypescriptConfig: vi.fn(), config: state.config}}));
vi.mock('../../utils/app.js', () => ({createSpinner: () => ({fail: vi.fn(), start: vi.fn(), succeed: vi.fn()})}));
vi.mock('../../utils/log.js', () => ({log: vi.fn()}));
vi.mock('../../utils/file.js', () => ({resolveBinaryPath: () => (state.missingBinary ? undefined : 'eslint')}));
vi.mock('fs', () => ({
  existsSync: (path: string) => basename(path).startsWith('.lex-temp-') ||
    ['chosen.mjs', 'tsconfig.json', 'package.json'].includes(basename(path)) ||
    (!state.noProject && basename(path) === 'eslint.config.mjs'),
  readFileSync: vi.fn(() => '{"type":"module"}'),
  unlinkSync: vi.fn(),
  writeFileSync: vi.fn()
}));

beforeEach(() => {
  vi.clearAllMocks();
  state.config.ai.provider = 'none';
  state.config.eslint = {};
  state.missingBinary = false;
  state.noProject = false;
  state.run.mockImplementation(async (command) => {
    if(command !== 'eslint') {
      throw new Error('Unexpected outbound/provider command');
    }
    return {exitCode: 0, stderr: '', stdout: ''};
  });
});

const callback = vi.fn<LintCallback>();

describe('lint subprocess option forwarding', () => {
  it('keeps rule spaces, quotes and shell metacharacters intact at the subprocess boundary', async () => {
    const rule = 'no-restricted-syntax: [error, {selector: "Literal[value=\'a b\']", message: "$(touch sentinel); $TOKEN & |"}]';

    expect(await lint({config: 'chosen.mjs', fixType: 'layout,suggestion', maxWarnings: '0', rule}, callback)).toBe(0);
    expect(state.run.mock.calls[0]).toEqual(['eslint', [
      'src/**/*.{js,jsx}', 'src/**/*.{ts,tsx}', '--config', `${process.cwd()}/chosen.mjs`,
      '--fix', '--fix-type', 'layout,suggestion', '--rule', rule, '--max-warnings', '0',
      '--no-error-on-unmatched-pattern', '--no-warn-ignored'
    ], {cwd: process.cwd(), reject: false, shell: false, stdio: 'pipe'}]);
  });

  it('check forwards config and warning policy without any fix or provider command', async () => {
    expect(await lint({check: true, config: 'chosen.mjs', maxWarnings: '0', rule: 'semi: error'}, callback)).toBe(0);
    expect(state.run).toHaveBeenCalledTimes(1);

    const [, args, options] = state.run.mock.calls[0];

    expect(args).not.toContain('--fix');
    expect(args).not.toContain('--fix-dry-run');
    expect(args).toContain(`${process.cwd()}/chosen.mjs`);
    expect(args).toContain('--max-warnings');
    expect(args.slice(args.indexOf('--rule'), args.indexOf('--rule') + 2)).toEqual(['--rule', 'semi: error']);
    expect(options).toMatchObject({shell: false});
  });

  it('forwards dry-run, custom config and warnings to both JS and TS commands', async () => {
    expect(await lint({config: 'chosen.mjs', fixDryRun: true, fixType: 'layout,suggestion', maxWarnings: '0', rule: 'semi: error'}, callback)).toBe(0);
    expect(state.run).toHaveBeenCalledTimes(1);

    for(const [command, args, options] of state.run.mock.calls) {
      expect(command).toBe('eslint');
      expect(args).toContain('--fix-dry-run');
      expect(args.slice(args.indexOf('--fix-type'), args.indexOf('--fix-type') + 2)).toEqual(['--fix-type', 'layout,suggestion']);
      expect(args.slice(args.indexOf('--rule'), args.indexOf('--rule') + 2)).toEqual(['--rule', 'semi: error']);
      expect(args).toContain('src/**/*.{ts,tsx}');
      expect(args).not.toContain('--fix');
      expect(args).toContain('--max-warnings');
      expect(args).toContain('0');
      expect(args).toContain(`${process.cwd()}/chosen.mjs`);
      expect(options).toMatchObject({shell: false});
    }
  });

  it('retains warning/configuration policy in post-AI nonfixing JS and TS checks', async () => {
    state.config.ai.provider = 'openai';
    state.run.mockResolvedValueOnce({exitCode: 1, stderr: '', stdout: ''});

    expect(await lint({config: 'chosen.mjs', fix: true, maxWarnings: '0', rule: 'semi: error'}, callback)).toBe(0);
    expect(state.run).toHaveBeenCalledTimes(2);

    for(const [, args] of state.run.mock.calls.slice(1)) {
      expect(args).not.toContain('--fix');
      expect(args).not.toContain('--fix-type');
      expect(args.slice(args.indexOf('--rule'), args.indexOf('--rule') + 2)).toEqual(['--rule', 'semi: error']);
      expect(args).toContain('--max-warnings');
      expect(args).toContain('0');
      expect(args).toContain(`${process.cwd()}/chosen.mjs`);
    }
  });

  it('default category-limited fixes do not opt into AI', async () => {
    state.config.ai.provider = 'openai';
    state.run.mockResolvedValueOnce({exitCode: 1, stderr: '', stdout: ''});

    expect(await lint({fixType: 'layout', rule: 'semi: error'}, callback)).toBe(1);
    expect(state.run).toHaveBeenCalledTimes(1);
    expect(state.run.mock.calls[0][1]).toContain('--fix');
    expect(state.run.mock.calls[0][1]).toContain('--fix-type');
  });

  it.each([{check: true}, {fix: true}])('rejects incompatible categories before config or subprocess work %j', async (mode) => {
    expect(await lint({...mode, fixType: 'PRIVATE-CATEGORY'}, callback)).toBe(1);
    expect(state.run).not.toHaveBeenCalled();
    expect(readFileSync).not.toHaveBeenCalled();
    expect(writeFileSync).not.toHaveBeenCalled();
    expect(unlinkSync).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalledWith(expect.stringContaining('PRIVATE-CATEGORY'), expect.anything(), expect.anything());
  });

  it.each(['thrown', 'rejected', 'resolved'])('sanitizes %s launch failures before printing subprocess output', async (failure) => {
    const sentinel = 'PRIVATE-RULE';
    const error = {code: 'ENOENT', command: 'PRIVATE-PATH', escapedCommand: 'PRIVATE-ARGS', message: 'PRIVATE-ENV', stderr: 'PRIVATE-STDERR', stdout: 'PRIVATE-STDOUT'};
    if(failure === 'thrown') {
      state.run.mockImplementationOnce(() => {
        throw error;
      });
    } else if(failure === 'rejected') {
      state.run.mockRejectedValueOnce(error);
    } else {
      state.run.mockResolvedValueOnce({...error, exitCode: undefined, failed: true});
    }
    const stdout = vi.spyOn(console, 'log').mockImplementation(() => {});
    const stderr = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(await lint({fixType: 'layout', rule: sentinel}, callback)).toBe(1);

      const output = JSON.stringify([vi.mocked(log).mock.calls, stdout.mock.calls, stderr.mock.calls]);

      expect(output).toContain('eslint');
      expect(output).toContain('ENOENT');
      expect(output).not.toContain('PRIVATE-');
    } finally {
      stdout.mockRestore();
      stderr.mockRestore();
    }
  });

  it('never echoes an untrusted launch error code', async () => {
    state.run.mockRejectedValueOnce({code: 'PRIVATE-CODE', message: 'PRIVATE-MESSAGE'});

    expect(await lint({check: true}, callback)).toBe(1);
    expect(JSON.stringify(vi.mocked(log).mock.calls)).toContain('UNKNOWN');
    expect(JSON.stringify(vi.mocked(log).mock.calls)).not.toContain('PRIVATE-');
  });

  it.each(['spawn rejection', 'missing binary'])('cleans only generated temporary configuration after %s', async (failure) => {
    state.config.eslint = {rules: {}};
    state.noProject = true;
    state.missingBinary = failure === 'missing binary';
    if(!state.missingBinary) {
      state.run.mockRejectedValueOnce(new Error('spawn failed'));
    }

    expect(await lint({fixDryRun: true}, callback)).toBe(1);
    expect(unlinkSync).toHaveBeenCalledWith(expect.stringMatching(/\.lex-temp-eslint-[^/]+\.cjs$/));
    expect(unlinkSync).not.toHaveBeenCalledWith(expect.stringMatching(/\.lex-temp-eslint\.cjs$/));
  });
});
