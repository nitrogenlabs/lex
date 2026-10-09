import {test, expect} from '@playwright/test';
import {spawn, spawnSync} from 'node:child_process';
import {mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync, existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {delimiter, join, resolve} from 'node:path';

for(const repo of ['pulsify', 'thekurupt']) {
  test(`${repo} installed wrapper preserves argv/cwd/default/status and doctor profile`, () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), 'lex-wrapper-')));
    const output = join(directory, 'calls.jsonl');
    try {
      symlinkSync(process.execPath, join(directory, 'node'));
      symlinkSync('/usr/bin/dirname', join(directory, 'dirname'));
      for(const command of ['docker', 'xcodebuild', 'watchman', 'ruby', 'bundle']) {
        writeFileSync(join(directory, command), `#!${process.execPath}\nrequire('node:fs').appendFileSync(${JSON.stringify(output)},JSON.stringify({args:process.argv.slice(2),command:${JSON.stringify(command)},cwd:process.cwd()})+'\\n');console.log('fixture');process.exit(${command === 'docker' ? 23 : 0});`, {mode:0o755});
      }
      const env = {...process.env, PATH: directory, DEVELOPER_DIR: '/fixture'};
      const script = resolve('../', repo, 'scripts/android-env');
      const result = spawnSync('/bin/bash', [script, 'bash', '-lc', 'literal $FOO; spaces', '', '--option'], {cwd:directory, env, encoding:'utf8'});
      expect(result.status).toBe(23);
      const bare = spawnSync('/bin/bash', [script], {cwd:directory, env, encoding:'utf8'});expect(bare.status).toBe(23);
      const doctor = spawnSync('/bin/bash', [resolve('../',repo,'scripts/ios-doctor')], {cwd:directory, env, encoding:'utf8'});expect(doctor.status).toBe(0);
      const calls = readFileSync(output,'utf8').trim().split('\n').map((line) => JSON.parse(line));
      expect(calls[0]).toEqual({args:['compose','run','--rm','--no-deps','android','bash','-lc','literal $FOO; spaces','','--option'],command:'docker',cwd:directory});
      expect(calls[1]).toEqual({args:['compose','run','--rm','--no-deps','android','bash'],command:'docker',cwd:directory});
      expect(calls.slice(2).map(({command,args}) => [command,args])).toEqual([
        ['xcodebuild',['-version']],['ruby',['--version']],...(repo === 'thekurupt' ? [['bundle',['--version']]] : []),['bundle',['exec','pod','--version']]
      ]);
    } finally {rmSync(directory,{recursive:true,force:true});}
  });
  test(`${repo} installed wrapper forwards SIGTERM`, async () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), 'lex-signal-')));
    const ready = join(directory,'ready');
    let child: ReturnType<typeof spawn> | undefined;
    try {
      writeFileSync(join(directory,'docker'), `#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(ready)},'ready');setInterval(()=>{},1000);`, {mode:0o755});
      child = spawn('/bin/bash',[resolve('../',repo,'scripts/android-env')],{cwd:directory,env:{...process.env,PATH:directory+delimiter+process.env.PATH},stdio:'ignore'});
      const exited = new Promise<{code:number|null;signal:string|null}>((done) => child!.once('exit',(code,signal)=>done({code,signal})));
      await expect.poll(()=>existsSync(ready),{timeout:15000}).toBe(true);
      child.kill('SIGTERM');
      expect(await exited).toEqual({code:143,signal:null});
    } finally {child?.kill('SIGTERM');rmSync(directory,{recursive:true,force:true});}
  });
}
