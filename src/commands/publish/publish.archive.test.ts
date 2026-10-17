import {execa} from 'execa';
import {mkdtempSync, mkdirSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, relative} from 'node:path';
import {afterAll, beforeEach, describe, expect, it, vi} from 'vitest';

import {LexConfig} from '../../LexConfig.js';
import {getPackageJson, setPackageJson} from '../../utils/app.js';
import {log} from '../../utils/log.js';
import {publish} from './publish.js';

vi.mock('execa', () => ({execa: vi.fn()}));
vi.mock('../../LexConfig.js', () => ({LexConfig: {config: {}, parseConfig: vi.fn()}}));
vi.mock('../../utils/log.js', () => ({log: vi.fn()}));
vi.mock('../../utils/app.js', () => ({
  createSpinner: vi.fn(() => ({fail: vi.fn(), succeed: vi.fn()})),
  getPackageJson: vi.fn(() => ({name: 'directory-package', version: '1.2.3'})),
  setPackageJson: vi.fn()
}));

const fixture = mkdtempSync(join(tmpdir(), 'lex-publish-'));
const archive = join(fixture, 'frozen archive.tgz');
writeFileSync(archive, 'validated separately by npm');
const callback = vi.fn<typeof process.exit>();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(execa).mockResolvedValue({} as never);
  vi.mocked(getPackageJson).mockReturnValue({name: 'directory-package', version: '1.2.3'});
  LexConfig.config = {} as typeof LexConfig.config;
});
afterAll(() => rmSync(fixture, {force: true, recursive: true}));

describe('immutable archive publishing', () => {
  it('passes the exact resolved archive and npm controls without reading cwd metadata', async () => {
    expect(await publish({dryRun: true, otp: '654321', packagePath: relative(process.cwd(), archive), private: true, tag: 'architecture-audit'}, callback)).toBe(0);
    expect(execa).toHaveBeenCalledWith('npm', ['publish', archive, '--ignore-scripts', '--dry-run', '--access', 'restricted', '--otp', '654321', '--tag', 'architecture-audit'], {encoding: 'utf8', stdio: 'pipe'});
    expect(getPackageJson).not.toHaveBeenCalled();
    expect(setPackageJson).not.toHaveBeenCalled();
    expect(LexConfig.parseConfig).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(0);
  });

  it('publishes an archive with npm defaults and inherited output without an OTP', async () => {
    expect(await publish({packagePath: archive}, callback)).toBe(0);
    expect(execa).toHaveBeenCalledWith('npm', ['publish', archive, '--ignore-scripts'], {encoding: 'utf8', stdio: 'inherit'});
  });

  it.each([{bump: 'patch'}, {newVersion: '2.0.0'}, {packageManager: 'yarn'}, {packageManager: 'pnpm'}, {packagePath: ''}, {packagePath: join(fixture, 'missing.tgz')}, {packagePath: join(fixture, 'file.zip')}])('rejects incompatible options or invalid archives: %j', async (options) => {
    expect(await publish({packagePath: archive, ...options}, callback)).toBe(1);
    expect(execa).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(1);
  });

  it('rejects a directory named .tgz', async () => {
    const directory = join(fixture, 'directory.tgz');
    mkdirSync(directory);
    expect(await publish({packagePath: directory}, callback)).toBe(1);
    expect(execa).not.toHaveBeenCalled();
  });

  it('redacts provided OTP from subprocess errors and captured output', async () => {
    vi.mocked(execa).mockRejectedValue(new Error('npm publish --otp 654321: failed 654321'));
    expect(await publish({otp: '654321', packagePath: archive}, callback)).toBe(1);
    expect(JSON.stringify(vi.mocked(log).mock.calls)).not.toContain('654321');
    expect(execa).toHaveBeenCalledWith('npm', expect.any(Array), {encoding: 'utf8', stdio: 'pipe'});
  });
});

describe('directory publishing compatibility', () => {
  it('preserves legacy passthrough for a malformed persisted package manager', async () => {
    // Deliberately inject invalid external state beyond the public npm/yarn config contract.
    LexConfig.config = {};
    Reflect.set(LexConfig.config, 'packageManager', 'pnpm');
    expect(await publish({}, callback)).toBe(0);
    expect(execa).toHaveBeenCalledWith('pnpm', ['publish'], {encoding: 'utf8', stdio: 'inherit'});
    expect(LexConfig.parseConfig).toHaveBeenCalledWith({});
    expect(callback).toHaveBeenCalledWith(0);
  });
  it.each(['major', 'minor', 'patch', 'alpha', 'beta', 'rc'])('retains %s version bumps', async (bump) => {
    expect(await publish({bump}, callback)).toBe(0);
    expect(setPackageJson).toHaveBeenCalledWith(expect.objectContaining({name: 'directory-package', version: expect.any(String)}), expect.stringContaining('/package.json'));
  });
  it('retains Yarn new-version and controls with explicit version precedence', async () => {
    expect(await publish({bump: 'patch', dryRun: true, newVersion: '3.0.0', packageManager: 'yarn', private: true, tag: 'beta'}, callback)).toBe(0);
    expect(execa).toHaveBeenCalledWith('yarn', ['publish', '--dry-run', '--access', 'restricted', '--tag', 'beta', '--new-version', '3.0.0'], {encoding: 'utf8', stdio: 'inherit'});
    expect(setPackageJson).not.toHaveBeenCalled();
  });
  it.each(['', 'banana', ' '])('rejects invalid bump %j without publishing', async (bump) => {
    // Empty bump retains the existing default API behavior.
    expect(await publish({bump}, callback)).toBe(bump ? 1 : 0);
  });
  it('rejects an invalid existing version', async () => {
    vi.mocked(getPackageJson).mockReturnValue({name: 'broken', version: 'bad'});
    expect(await publish({bump: 'patch'}, callback)).toBe(1);
    expect(execa).not.toHaveBeenCalled();
  });
  it('handles malformed package metadata', async () => {
    vi.mocked(getPackageJson).mockImplementationOnce(() => {throw new Error('bad metadata');});
    expect(await publish({}, callback)).toBe(1);
    expect(execa).not.toHaveBeenCalled();
  });
  it('handles version write failures', async () => {
    vi.mocked(setPackageJson).mockImplementationOnce(() => {throw new Error('write denied');});
    expect(await publish({newVersion: '2.0.0'}, callback)).toBe(1);
    expect(execa).not.toHaveBeenCalled();
  });
  it('redacts OTP from directory publish failures', async () => {
    vi.mocked(execa).mockRejectedValue(new Error('otp 654321 failed'));
    expect(await publish({otp: '654321'}, callback)).toBe(1);
    expect(JSON.stringify(vi.mocked(log).mock.calls)).not.toContain('654321');
  });
});
