import {unlinkSync} from 'fs';
import {basename} from 'node:path';
import {beforeEach, describe, expect, it, vi} from 'vitest';

import {lint} from './lint.js';

import type {LintCallback} from './lint.js';

type CommandRunner = (command: string, args: string[], options: Record<string, unknown>) =>
Promise<{exitCode: number; stderr: string; stdout: string}>;

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
  readFileSync: () => '{"type":"module"}',
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
  it('check forwards config and warning policy without any fix or provider command', async () => {
    expect(await lint({check: true, config: 'chosen.mjs', maxWarnings: '0'}, callback)).toBe(0);
    expect(state.run).toHaveBeenCalledTimes(1);

    const [, args, options] = state.run.mock.calls[0];

    expect(args).not.toContain('--fix');
    expect(args).not.toContain('--fix-dry-run');
    expect(args).toContain(`${process.cwd()}/chosen.mjs`);
    expect(args).toContain('--max-warnings');
    expect(options).toMatchObject({shell: false});
  });

  it('forwards dry-run, custom config and warnings to both JS and TS commands', async () => {
    expect(await lint({config: 'chosen.mjs', fixDryRun: true, maxWarnings: '0'}, callback)).toBe(0);
    expect(state.run).toHaveBeenCalledTimes(1);

    for(const [command, args, options] of state.run.mock.calls) {
      expect(command).toBe('eslint');
      expect(args).toContain('--fix-dry-run');
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

    expect(await lint({config: 'chosen.mjs', fix: true, maxWarnings: '0'}, callback)).toBe(0);
    expect(state.run).toHaveBeenCalledTimes(2);

    for(const [, args] of state.run.mock.calls.slice(1)) {
      expect(args).not.toContain('--fix');
      expect(args).toContain('--max-warnings');
      expect(args).toContain('0');
      expect(args).toContain(`${process.cwd()}/chosen.mjs`);
    }
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
