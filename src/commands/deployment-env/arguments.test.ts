import {expect, test} from 'vitest';

import {descriptor} from '../../utils/deployment/environment.test.js';
import {parseDeploymentEnvArgs, selectDeploymentEnvStages} from './arguments.js';

test('parses strict arguments and stage policy', () => {
  expect(parseDeploymentEnvArgs('setup', ['--stage','dev','--env-file','fixture.env','--repo','owner/repo','--dry-run','--quiet'], 'fixture.json')).toEqual({descriptorPath:'fixture.json', dryRun:true, envFile:'fixture.env', mode:'setup', quiet:true, repo:'owner/repo', stage:'dev'});

  for(const args of [['--repo'], ['--repo','--dry-run'], ['--repo','x'], ['--repo','../x'], ['--repo','a/b','--repo','c/d'], ['--bad'], ['--descriptor','x']]) {
    expect(() => parseDeploymentEnvArgs('setup', args, 'x')).toThrow();
  }

  expect(selectDeploymentEnvStages({descriptorPath:'x',mode:'setup'},descriptor,{})).toEqual(['dev','prod']);
  expect(selectDeploymentEnvStages({descriptorPath:'x',mode:'setup',stage:'all'},descriptor,{stage:'bad'})).toEqual(['dev','prod']);
  expect(selectDeploymentEnvStages({descriptorPath:'x',mode:'validate'},descriptor,{DEPLOY_STAGE:'dev',STAGE:'dev',stage:'dev'})).toEqual(['dev']);

  for(const [stage, values] of [['all',{}],['bad',{}],[undefined,{}],['prod',{stage:'dev'}],[undefined,{STAGE:'prod',stage:'dev'}]] as const) {
    expect(() => selectDeploymentEnvStages({descriptorPath:'x',mode:'validate',stage},descriptor,values)).toThrow();
  }
});
