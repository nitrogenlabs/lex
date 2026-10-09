import {expect, it, vi} from 'vitest';
import {runDeploymentEnvProcess} from './process.js';
import {spawnSync} from 'node:child_process';
vi.mock('node:child_process', () => ({spawnSync: vi.fn()}));
it('captures output and sends stdin without shell', async () => {
  vi.mocked(spawnSync).mockReturnValue({status:0, stdout:'owner/repo', stderr:'sentinel', signal:null, pid:1, output:[]} as never);
  expect(await runDeploymentEnvProcess({args:['secret','set','S'],input:'sentinel'})).toEqual({status:0,stdout:'owner/repo'});
  expect(spawnSync).toHaveBeenCalledWith('gh',['secret','set','S'], {encoding:'utf8', input:'sentinel', shell:false, stdio:['pipe','pipe','pipe']});
  vi.mocked(spawnSync).mockReturnValue({status:null, stdout:'sentinel', stderr:'sentinel', signal:'SIGTERM', error:new Error('sentinel')} as never);
  expect(await runDeploymentEnvProcess({args:[]})).toEqual({signal:'SIGTERM',status:null,stdout:''});
  vi.mocked(spawnSync).mockReturnValue({status:1,stdout:'sentinel',signal:null} as never);
  expect(await runDeploymentEnvProcess({args:[]})).toEqual({status:1,stdout:''});
  vi.mocked(spawnSync).mockImplementation(() => {throw new Error('sentinel');});
  await expect(runDeploymentEnvProcess({args:[]})).rejects.toThrow('GitHub process unavailable');
});
