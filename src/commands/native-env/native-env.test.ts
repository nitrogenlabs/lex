import {describe, expect, it, vi} from 'vitest';

import {nativeEnv} from './native-env.js';

describe('native environment invocation', () => {
  it('preserves default Compose discovery and bash without starting dependencies', async () => {
    const run = vi.fn(async () => 0);
    const callback = vi.fn();

    expect(await nativeEnv({}, callback, {run})).toBe(0);
    expect(run).toHaveBeenCalledWith('docker', ['compose', 'run', '--rm', '--no-deps', 'android', 'bash'], process.cwd());
    expect(callback).toHaveBeenCalledWith(0);
  });

  it('preserves argv, explicit paths, cwd and exact child exit', async () => {
    const run = vi.fn(async () => 37);
    const args = ['bash', '-lc', 'echo "a b"; exit 37', '', '--device'];

    expect(await nativeEnv({args, composeFile: 'local file.yaml', cwd: '/tmp/project', service: 'sdk', workdir: '/work space'}, undefined, {run})).toBe(37);
    expect(run).toHaveBeenCalledWith('docker', ['compose', '--file', '/tmp/project/local file.yaml', 'run', '--rm', '--no-deps', '--workdir', '/work space', 'sdk', ...args], '/tmp/project');
  });

  it('maps a missing executable to failure without throwing or installing', async () => {
    const write = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    try {
      expect(await nativeEnv({}, undefined, {run: async () => {
        throw new Error('private failure');
      }})).toBe(1);

      const output = write.mock.calls.map(([message]) => String(message)).join('');

      expect(output).toContain('docker');
      expect(output).not.toContain('private failure');
    } finally {
      write.mockRestore();
    }
  });
});
