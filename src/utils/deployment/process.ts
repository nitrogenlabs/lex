import {spawnSync} from 'node:child_process';
import type {DeploymentEnvRunner} from '../../commands/deployment-env/deployment-env.types.js';

export const runDeploymentEnvProcess: DeploymentEnvRunner = async ({args, input}) => {
  try {
    const result = spawnSync('gh', [...args], {encoding: 'utf8', input, shell: false, stdio: ['pipe', 'pipe', 'pipe']});
    return { ...(result.signal ? {signal: result.signal} : {}), status: result.error ? null : result.status, stdout: result.status === 0 && !result.error ? result.stdout : ''};
  } catch {
    throw new Error('GitHub process unavailable');
  }
};
