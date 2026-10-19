import {isDeploymentEnvRepository} from '../../utils/deployment/environment.js';

import type {DeploymentEnvDescriptor, DeploymentEnvMode, DeploymentEnvOptions, DeploymentEnvValues} from './deployment-env.types.js';

export const parseDeploymentEnvArgs = (
  mode: DeploymentEnvMode,
  args: readonly string[],
  descriptorPath: string
): DeploymentEnvOptions => {
  if(!['setup', 'validate'].includes(mode)) {
    throw new Error('Invalid deployment mode');
  }
  const options: {
    descriptorPath: string;
    dryRun?: boolean;
    envFile?: string;
    mode: DeploymentEnvMode;
    quiet?: boolean;
    repo?: string;
    stage?: string;
  } = {descriptorPath, mode};
  const seen = new Set<string>();
  for(let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if(!['--dry-run', '--quiet', '--env-file', '--repo', '--stage'].includes(arg)) {
      throw new Error('Unknown deployment option');
    }
    if(seen.has(arg)) {
      throw new Error(`Repeated option ${arg}`);
    }
    seen.add(arg);
    if(arg === '--dry-run') {
      options.dryRun = true;
    } else if(arg === '--quiet') {
      options.quiet = true;
    } else {
      const value = args[++index];
      if(!value || value.startsWith('--')) {
        throw new Error(`Missing operand ${arg}`);
      }
      if(arg === '--repo') {
        if(!isDeploymentEnvRepository(value)) {
          throw new Error('Invalid --repo');
        }
        options.repo = value;
      } else if(arg === '--stage') {
        options.stage = value;
      } else {
        options.envFile = value;
      }
    }
  }
  return options;
};

export const selectDeploymentEnvStages = (
  options: DeploymentEnvOptions,
  descriptor: DeploymentEnvDescriptor,
  values: DeploymentEnvValues
): readonly string[] => {
  if(!['setup', 'validate'].includes(options.mode)) {
    throw new Error('Invalid deployment mode');
  }
  const aliases = options.mode === 'validate' ? [options.stage, values.DEPLOY_STAGE, values.stage, values.STAGE].filter((value) => !!value) : [];
  if(new Set(aliases).size > 1) {
    throw new Error('Conflicting deployment stages');
  }
  const stage = options.stage || aliases[0] || (options.mode === 'setup' ? 'all' : '');
  if(stage === 'all' && options.mode === 'setup') {
    return Object.keys(descriptor.stages);
  }
  if(!stage || stage === 'all' || !Object.hasOwn(descriptor.stages, stage)) {
    throw new Error('Invalid deployment stage');
  }
  return [stage];
};
