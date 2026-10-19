import {spawnSync} from 'node:child_process';
import {expect, test, vi} from 'vitest';

import {runDeploymentEnvProcess} from './process.js';

import type {SpawnSyncReturns} from 'node:child_process';

vi.mock('node:child_process', () => ({spawnSync: vi.fn()}));

test('captures output and sends stdin without shell', async () => {
  const success: SpawnSyncReturns<string> = {
    output: [],
    pid: 1,
    signal: null,
    status: 0,
    stderr: 'sentinel',
    stdout: 'owner/repo'
  };
  vi.mocked(spawnSync).mockReturnValue(success);

  expect(await runDeploymentEnvProcess({args:['secret','set','S'],input:'sentinel'})).toEqual({status:0,stdout:'owner/repo'});
  expect(spawnSync).toHaveBeenCalledWith('gh',['secret','set','S'], {encoding:'utf8', input:'sentinel', shell:false, stdio:['pipe','pipe','pipe']});

  const signaled: SpawnSyncReturns<string> = {
    error: new Error('sentinel'),
    output: [],
    pid: 1,
    signal: 'SIGTERM',
    status: null,
    stderr: 'sentinel',
    stdout: 'sentinel'
  };
  vi.mocked(spawnSync).mockReturnValue(signaled);

  expect(await runDeploymentEnvProcess({args:[]})).toEqual({signal:'SIGTERM',status:null,stdout:''});

  const failed: SpawnSyncReturns<string> = {
    output: [],
    pid: 1,
    signal: null,
    status: 1,
    stderr: '',
    stdout: 'sentinel'
  };
  vi.mocked(spawnSync).mockReturnValue(failed);

  expect(await runDeploymentEnvProcess({args:[]})).toEqual({status:1,stdout:''});

  vi.mocked(spawnSync).mockImplementation(() => {
    throw new Error('sentinel');
  });

  await expect(runDeploymentEnvProcess({args:[]})).rejects.toThrow('GitHub process unavailable');
});
