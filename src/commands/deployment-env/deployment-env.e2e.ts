import {expect, test} from '@playwright/test';
import {spawnSync} from 'node:child_process';
import {chmodSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';

test('deployment env CLI synthetic validate/setup/dry-run and redaction', () => {
  const dir = realpathSync(mkdtempSync(resolve(tmpdir(), 'lex-env-')));
  try {
    const cli = process.env.LEX_DEPLOYMENT_ENV_CLI || resolve('lib/lex.js');
    const descriptor = {repository:'owner/repo',schemaVersion:1,setup:{optionalVariableNames:[],requiredSecretNames:['S'],requiredVariableNames:['A']},stages:{dev:{defaults:{A:'default'},environment:'dev'},prod:{defaults:{A:'default'},environment:'prod'}},validation:{optionalVariableNames:[],requiredSecretNames:['S'],requiredVariableNames:['A']}};
    writeFileSync(resolve(dir,'descriptor.json'),JSON.stringify(descriptor));
    writeFileSync(resolve(dir,'gh'),`#!/usr/bin/env node\nconst fs=require('node:fs');const args=process.argv.slice(2);const input=fs.readFileSync(0,'utf8');fs.appendFileSync(process.env.RECORD,JSON.stringify({args,input})+'\\n');if(process.env.FAIL && args[0]==='variable'){console.error('sentinel');process.exit(3);}`);chmodSync(resolve(dir,'gh'),0o755);
    const run = (args: string[], extra = {}) => spawnSync(process.execPath,[cli,'deployment-env',...args],{cwd:dir,encoding:'utf8',env:{A:'value',HOME:dir,PATH:`${dir}:${resolve(process.execPath,'..')}`,RECORD:resolve(dir,'record'),S:'sentinel',...extra}});
    for(const stage of ['dev','all']) {const result=run(['setup','--descriptor','descriptor.json','--stage',stage]);expect(result.status,result.stdout+result.stderr).toBe(0);}
    const calls=readFileSync(resolve(dir,'record'),'utf8').trim().split('\n').map((line)=>JSON.parse(line));
    expect(calls).toHaveLength(9);expect(calls[1].input).toBe('sentinel');expect(calls[1].args).not.toContain('sentinel');
    expect(run(['validate','--descriptor','descriptor.json','--stage','dev']).status).toBe(0);
    const before=readFileSync(resolve(dir,'record'),'utf8');
    const dry=run(['setup','--descriptor','descriptor.json','--repo','owner/repo','--dry-run']);expect(dry.status).toBe(0);expect(dry.stdout).not.toContain('sentinel');expect(readFileSync(resolve(dir,'record'),'utf8')).toBe(before);
    for(const args of [['setup'],['setup','--descriptor'],['setup','--descriptor','descriptor.json','--bad'],['validate','--descriptor','descriptor.json','--stage','bad'],['setup','--descriptor','descriptor.json','--repo','a/b','--repo','c/d']]) expect(run(args).status).toBe(1);
    const failure=run(['setup','--descriptor','descriptor.json','--stage','dev'],{FAIL:'1'});expect(failure.status).toBe(1);expect(failure.stdout+failure.stderr).not.toContain('sentinel');
  } finally {rmSync(dir,{recursive:true,force:true});}
});
