import {expect, it, vi} from 'vitest';
import {descriptor} from '../../utils/deployment/environment.test.js';
import {deploymentEnv, deploymentEnvFromArgs} from './deployment-env.js';
import type {DeploymentEnvDependencies} from './deployment-env.types.js';
const fixture = (overrides: Partial<DeploymentEnvDependencies> = {}): DeploymentEnvDependencies => ({readText:vi.fn(async () => JSON.stringify(descriptor)),report:vi.fn(),run:vi.fn(async () => ({status:0,stdout:'owner/repo'})),values:{S:'sentinel',A:' a=b ',O:' '},...overrides});
it('prevalidates all stages and emits value-free dry-run plans', async () => {
  const deps=fixture({values:{DEV_S:'sentinel'}});
  expect((await deploymentEnv({descriptorPath:'x',mode:'setup',repo:'owner/repo'},undefined,deps)).status).toBe(1);
  expect(deps.run).not.toHaveBeenCalled();
  const success=fixture(); const callback=vi.fn();
  const result=await deploymentEnv({descriptorPath:'x',dryRun:true,mode:'setup',repo:'owner/repo'},callback,success);
  expect(result.status).toBe(0); expect(result.plan?.targets).toHaveLength(6);
  expect(JSON.stringify(result)).not.toContain('sentinel'); expect(success.run).not.toHaveBeenCalled();expect(callback).toHaveBeenCalledExactlyOnceWith(0);
});
it('applies exact order, stdin and ordinary bytes; stops on partial failure', async () => {
  const deps=fixture();
  const result=await deploymentEnv({descriptorPath:'x',mode:'setup',repo:'owner/repo',stage:'dev'},undefined,deps);
  expect(result.completed).toHaveLength(3);
  expect(deps.run).toHaveBeenNthCalledWith(1,{args:['api','--method','PUT','repos/owner/repo/environments/development']});
  expect(deps.run).toHaveBeenNthCalledWith(2,{args:['secret','set','S','--repo','owner/repo','--env','development'],input:'sentinel'});
  expect(deps.run).toHaveBeenNthCalledWith(3,{args:['variable','set','A','--repo','owner/repo','--env','development','--body',' a=b ']});
  for(const failure of [{status:1,stdout:'sentinel'}, {status:null,signal:'SIGTERM',stdout:'sentinel'}, new Error('sentinel')]) {
    let count=0; const broken=fixture({run:vi.fn(async () => {if(++count===3) {if(failure instanceof Error) throw failure;return failure;}return {status:0,stdout:''};})});
    const partial=await deploymentEnv({descriptorPath:'x',mode:'setup',repo:'owner/repo'},undefined,broken);
    expect(partial.status).toBe(1);expect(partial.completed).toHaveLength(2);expect(partial.pending).toHaveLength(4);expect(count).toBe(3);
    expect(JSON.stringify([partial,vi.mocked(broken.report).mock.calls])).not.toContain('sentinel');
  }
});
it('handles explicit files, discovery, local errors, validation and quiet', async () => {
  const deps=fixture({readText:vi.fn(async (path) => path==='x'?JSON.stringify(descriptor):'S=sentinel\nA=file')});
  expect((await deploymentEnv({descriptorPath:'x',envFile:'env',mode:'validate',stage:'dev'},undefined,deps)).status).toBe(0);expect(deps.run).not.toHaveBeenCalled();
  expect((await deploymentEnv({descriptorPath:'x',mode:'setup'},undefined,deps)).status).toBe(0);
  expect(deps.run).toHaveBeenCalledWith({args:['repo','view','--json','nameWithOwner','-q','.nameWithOwner']});
  for(const options of [{dryRun:true}, {repo:'bad'}, {stage:'bad'}]) expect((await deploymentEnv({descriptorPath:'x',mode:'setup',...options},undefined,fixture())).status).toBe(1);
  for(const stdout of ['bad','owner/repo\nsentinel']) expect((await deploymentEnv({descriptorPath:'x',mode:'setup'},undefined,fixture({run:async()=>({status:0,stdout})}))).status).toBe(1);
  expect((await deploymentEnv({descriptorPath:'x',mode:'setup'},undefined,fixture({readText:async()=>{throw new Error('sentinel');}}))).status).toBe(1);
  const quiet=fixture();await deploymentEnv({descriptorPath:'x',dryRun:true,mode:'setup',quiet:true,repo:'owner/repo'},undefined,quiet);expect(quiet.report).not.toHaveBeenCalled();
  const callback=vi.fn();expect((await deploymentEnvFromArgs('setup',['--bad'],'x',callback)).status).toBe(1);expect(callback).toHaveBeenCalledExactlyOnceWith(1);
});

it('uses the default public wrapper with explicit descriptor files', async () => {
  const {mkdtemp, writeFile, rm} = await import('node:fs/promises');
  const {tmpdir} = await import('node:os');
  const {join} = await import('node:path');
  const dir = await mkdtemp(join(tmpdir(), 'lex-env-unit-'));
  const path = join(dir, 'descriptor.json');
  try {
    await writeFile(path, JSON.stringify({...descriptor, setup: {optionalVariableNames: [], requiredSecretNames: [], requiredVariableNames: []}}));
    expect((await deploymentEnvFromArgs('setup', ['--dry-run','--repo','owner/repo','--quiet'], path)).status).toBe(0);
  } finally {await rm(dir,{force:true,recursive:true});}
});
