import {spawnSync} from 'node:child_process';
import {mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {delimiter, join, resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

describe('built native CLI', () => {
  it('forwards arbitrary Docker argv and returns its status', () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), 'lex-native-')));
    try {
      const output = join(directory, 'argv.json');
      writeFileSync(join(directory, 'docker'), `#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(output)}, JSON.stringify({args:process.argv.slice(2),cwd:process.cwd()})); process.exit(23);`, {mode: 0o755});
      const result = spawnSync(process.execPath, [resolve('lib/lex.js'), 'native-env', '--cwd', directory, '--', 'bash', '-lc', 'echo "a b"; $EXACT', '', '--version'], {encoding: 'utf8', env: {...process.env, PATH: directory + delimiter + process.env.PATH}});

      expect(result.status).toBe(23);
      expect(JSON.parse(readFileSync(output, 'utf8'))).toEqual({args: ['compose', 'run', '--rm', '--no-deps', 'android', 'bash', '-lc', 'echo "a b"; $EXACT', '', '--version'], cwd: directory});
    } finally {
      rmSync(directory, {force: true, recursive: true});
    }
  });

  it('runs aggregate doctor with explicit profile and child-only developer override', () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), 'lex-doctor-')));
    try {
      const output = join(directory, 'calls.jsonl');
      for(const command of ['xcodebuild', 'watchman', 'ruby', 'bundle']) {
        writeFileSync(join(directory, command), `#!${process.execPath}\nrequire('node:fs').appendFileSync(${JSON.stringify(output)},JSON.stringify({args:process.argv.slice(2),command:${JSON.stringify(command)},cwd:process.cwd(),developer:process.env.DEVELOPER_DIR})+'\\n');console.log('fixture');`, {mode: 0o755});
      }
      const result = spawnSync(process.execPath, [resolve('lib/lex.js'), 'native-doctor', '--platform', 'ios', '--cwd', directory, '--developer-dir', '/fixture/Xcode', '--require-bundler'], {encoding: 'utf8', env: {...process.env, DEVELOPER_DIR: '/original', PATH: directory}});

      expect(result.status).toBe(0);
      expect(readFileSync(output, 'utf8').trim().split('\n').map((line) => JSON.parse(line))).toEqual([
        {args:['-version'],command:'xcodebuild',cwd:directory,developer:'/fixture/Xcode'},
        {args:['--version'],command:'ruby',cwd:directory,developer:'/fixture/Xcode'},
        {args:['--version'],command:'bundle',cwd:directory,developer:'/fixture/Xcode'},
        {args:['exec','pod','--version'],command:'bundle',cwd:directory,developer:'/fixture/Xcode'}
      ]);
    } finally {
      rmSync(directory, {force: true, recursive: true});
    }
  });
});
