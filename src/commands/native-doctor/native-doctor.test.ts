import {describe, expect, it, vi} from 'vitest';
import {nativeDoctor} from './native-doctor.js';

const fixture = (available = true) => ({
  env: {} as NodeJS.ProcessEnv,
  exists: vi.fn(() => available),
  find: vi.fn((command: string) => available ? '/tools/' + command : undefined),
  report: vi.fn(),
  run: vi.fn(() => ({status: available ? 0 : 1, stdout: 'fixture version\n'}))
});
describe('iOS doctor', () => {
  it('aggregates all required failures without short circuit or installs', async () => {
    const deps = fixture(false); const callback = vi.fn();
    expect(await nativeDoctor({platform: 'ios', requireBundler: true}, callback, deps)).toBe(1);
    expect(deps.run.mock.calls.map((call: any) => [call[0], call[1]])).toEqual([
      ['xcodebuild', ['-version']], ['ruby', ['--version']], ['bundle', ['--version']], ['bundle', ['exec', 'pod', '--version']]
    ]);
    expect(deps.report.mock.calls.map(([message]) => message)).toEqual([
      'missing  full Xcode with selected command-line tools', 'missing  watchman (brew bundle)', 'missing  project Ruby (install the .ruby-version through rbenv)', 'missing  Bundler (run rbenv exec gem install bundler)', 'missing  bundled CocoaPods (run bundle install)'
    ]);
    expect(callback).toHaveBeenCalledWith(1);
  });
  it('uses rbenv and standard directory only in child environment, with optional Bundler omitted', async () => {
    const deps = fixture();
    expect(await nativeDoctor({cwd: '/project', platform: 'ios'}, undefined, deps)).toBe(0);
    expect(deps.run.mock.calls.map((call: any) => [call[0], call[1]])).toEqual([
      ['xcodebuild', ['-version']], ['rbenv', ['exec', 'ruby', '--version']], ['rbenv', ['exec', 'bundle', 'exec', 'pod', '--version']]
    ]);
    expect((deps.run.mock.calls as any)[0][2]).toBe('/project');
    expect((deps.run.mock.calls as any)[0][3].DEVELOPER_DIR).toBe('/Applications/Xcode.app/Contents/Developer');
    expect(deps.env.DEVELOPER_DIR).toBeUndefined();
  });
  it.each([['/chosen', '/existing', '/chosen'], [undefined, '/existing', '/existing'], [undefined, '', undefined]])('honors explicit and existing developer directory', async (developerDir, existing, expected) => {
    const deps = fixture();deps.env.DEVELOPER_DIR = existing;deps.exists.mockReturnValue(false);
    expect(await nativeDoctor({developerDir, platform: 'ios', requireBundler: true}, undefined, deps)).toBe(0);
    expect((deps.run.mock.calls as any)[0][3].DEVELOPER_DIR).toBe(expected ?? '');
    expect(deps.env.DEVELOPER_DIR).toBe(existing);
  });
  it('handles subprocess errors while continuing later diagnostics', async () => {
    const deps = fixture();deps.run.mockImplementation(() => {throw new Error('unavailable');});
    expect(await nativeDoctor({platform: 'ios'}, undefined, deps)).toBe(1);
    expect(deps.run).toHaveBeenCalledTimes(3);
  });
});
