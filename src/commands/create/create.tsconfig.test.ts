import {existsSync, mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {LexConfig} from '../../LexConfig.js';
import {create} from './create.js';

test('creates a TypeScript configuration from the owning package in a different consumer directory', async () => {
  const originalCwd = process.cwd();
  const originalConfig = LexConfig.config;
  const fixture = mkdtempSync(join(tmpdir(), 'lex-create-tsconfig-'));
  vi.spyOn(LexConfig, 'parseConfig').mockResolvedValue(undefined);
  vi.spyOn(LexConfig, 'getLexDir').mockReturnValue(originalCwd);
  LexConfig.config = {...originalConfig, outputPath: './lib', sourcePath: './src', useTypescript: false};

  try {
    process.chdir(fixture);

    expect(await create('tsconfig', {quiet: true})).toBe(0);
    expect(existsSync(join(fixture, 'tsconfig.json'))).toBe(true);
    expect(JSON.parse(readFileSync(join(fixture, 'tsconfig.json'), 'utf8')).include).toContain('./src');
  } finally {
    process.chdir(originalCwd);
    LexConfig.config = originalConfig;
    vi.restoreAllMocks();
    rmSync(fixture, {force: true, recursive: true});
  }
});
