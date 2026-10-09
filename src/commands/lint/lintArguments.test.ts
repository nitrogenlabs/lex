import {describe, expect, it} from 'vitest';

import {assertCheckOptions, assertDryRunOptions, eslintArguments} from './lintArguments.js';

describe('ESLint lint run arguments', () => {
  it('preserves built-in fixing by default and supports nonfixing rechecks', () => {
    expect(eslintArguments(true, false)).toContain('--fix');
    expect(eslintArguments(false, false)).not.toContain('--fix');
  });

  it('prioritizes dry-run and forwards debug/configuration/warnings as structured arguments', () => {
    const args = eslintArguments(true, true, {configPath: 'custom config.mjs', fixDryRun: true, maxWarnings: '0', readOnlyCacheLocation: 'unused-cache'});

    expect(args).toContain('--fix-dry-run');
    expect(args).not.toContain('--fix');
    expect(args).toContain('--debug');
    expect(args.slice(args.indexOf('--cache-location'), args.indexOf('--cache-location') + 2)).toEqual(['--cache-location', 'unused-cache']);
    expect(args.slice(0, 2)).toEqual(['--config', 'custom config.mjs']);
    expect(args.slice(args.indexOf('--max-warnings'), args.indexOf('--max-warnings') + 2)).toEqual(['--max-warnings', '0']);
  });

  it.each([[false, false, false], [false, true, true], [true, false, false]])('permits compatible dry-run options %j', (dryRun, fix, comments) => {
    expect(() => assertDryRunOptions(dryRun, fix, comments)).not.toThrow();
  });

  it.each([[true, true, false], [true, false, true]])('rejects mutative dry-run options %j', (dryRun, fix, comments) => {
    expect(() => assertDryRunOptions(dryRun, fix, comments)).toThrow('--fixDryRun cannot');
  });
});

describe('check option guards', () => {
  it.each([[false, false, false, false], [false, true, true, true], [true, false, false, false]])('permits compatible options %j', (check, dryRun, fix, comments) => {
    expect(() => assertCheckOptions(check, dryRun, fix, comments)).not.toThrow();
  });

  it.each([[true, true, false, false], [true, false, true, false], [true, false, false, true]])('rejects mutation or in-memory fixing %j', (check, dryRun, fix, comments) => {
    expect(() => assertCheckOptions(check, dryRun, fix, comments)).toThrow('--check cannot');
  });
});
