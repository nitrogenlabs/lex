import {readFile} from 'node:fs/promises';

import {isDeploymentEnvRepository, parseDeploymentEnvDescriptor, parseDeploymentEnvText, resolveDeploymentEnvValue, validateDeploymentEnvStage} from '../../utils/deployment/environment.js';
import {runDeploymentEnvProcess} from '../../utils/deployment/process.js';
import {parseDeploymentEnvArgs, selectDeploymentEnvStages} from './arguments.js';

import type {DeploymentEnvDependencies, DeploymentEnvMode, DeploymentEnvOptions, DeploymentEnvPlan, DeploymentEnvResult, DeploymentEnvTarget} from './deployment-env.types.js';

const reportDefault = (message: string): void => {
  // eslint-disable-next-line no-console
  console.log(message);
};
export const deploymentEnv = async (
  options: DeploymentEnvOptions,
  callback?: (status: number) => void,
  dependencies?: DeploymentEnvDependencies
): Promise<DeploymentEnvResult> => {
  const deps = dependencies || {readText: (path: string) => readFile(path, 'utf8'), report: reportDefault, run: runDeploymentEnvProcess, values: {...process.env}};
  const completed: DeploymentEnvTarget[] = [];
  const pending: DeploymentEnvTarget[] = [];
  let plan: DeploymentEnvPlan | undefined;
  let status: 0 | 1 = 1;
  let message = 'Deployment environment validation failed';
  try {
    const descriptor = parseDeploymentEnvDescriptor(await deps.readText(options.descriptorPath));
    const stages = selectDeploymentEnvStages(options, descriptor, deps.values);
    if(options.repo !== undefined && !isDeploymentEnvRepository(options.repo)) {
      throw new Error();
    }
    const file = options.envFile ? parseDeploymentEnvText(await deps.readText(options.envFile)) : {};
    const requirement = descriptor[options.mode === 'setup' ? 'setup' : 'validation'];
    const resolved: Record<string, Record<string, string>> = Object.create(null);
    const failures: string[] = [];
    for(const stage of stages) {
      const values: Record<string, string> = Object.create(null);
      for(const name of [
        ...requirement.requiredSecretNames,
        ...requirement.requiredVariableNames,
        ...requirement.optionalVariableNames
      ]) {
        values[name] = resolveDeploymentEnvValue(
          stage, name, options.mode, file, deps.values, descriptor.stages[stage].defaults
        );
      }
      resolved[stage] = values;
      const missing = validateDeploymentEnvStage(descriptor, stage, options.mode, values);
      if(missing.length) {
        failures.push(`${stage}: ${missing.join(', ')}`);
      }
    }
    if(failures.length) {
      message = `Invalid settings ${failures.join('; ')}`;
      throw new Error();
    }
    if(options.mode === 'setup') {
      for(const stage of stages) {
        const {environment} = descriptor.stages[stage];
        pending.push({environment, kind: 'environment', stage});
        for(const name of requirement.requiredSecretNames) {
          pending.push({environment, kind: 'secret', name, stage});
        }
        for(const name of [...requirement.requiredVariableNames, ...requirement.optionalVariableNames]) {
          if(resolved[stage][name].trim()) {
            pending.push({environment, kind: 'variable', name, stage});
          }
        }
      }
    }
    let repository = options.repo || descriptor.repository;
    if(options.mode === 'setup' && !repository) {
      if(options.dryRun) {
        throw new Error();
      }
      const discovery = await deps.run({args: ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner']});
      repository = discovery.stdout.trim();
      if(discovery.status !== 0 || !isDeploymentEnvRepository(repository)) {
        throw new Error();
      }
    }
    plan = {mode: options.mode, ...(repository ? {repository} : {}), targets: [...pending]};
    if(options.mode === 'setup' && !options.dryRun) {
      while(pending.length) {
        const target = pending[0];
        message = `Failed ${target.kind} ${target.name || ''} in ${target.stage}; completed ${completed.length}, pending ${pending.length}`;
        const value = target.name ? resolved[target.stage][target.name] : '';
        const request = target.kind === 'environment'
          ? {args: ['api', '--method', 'PUT', `repos/${repository}/environments/${target.environment}`]}
          : {args: [target.kind, 'set', target.name!, '--repo', repository!, '--env', target.environment, ...(target.kind === 'variable' ? ['--body', value] : [])], ...(target.kind === 'secret' ? {input: value} : {})};
        // eslint-disable-next-line no-await-in-loop -- Preserve fail-stop checkpoints and target order.
        const result = await deps.run(request);
        if(result.status !== 0) {
          if(result.signal) {
            message += ' (signal)';
          } else if(result.status === null) {
            message += ' (unavailable)';
          } else {
            message += ` (exit ${result.status})`;
          }
          throw new Error();
        }
        completed.push(pending.shift()!);
      }
    }
    status = 0;
    message = `Deployment environment ${options.mode === 'validate' || options.dryRun ? 'validated' : 'completed'} for ${stages.join(', ')}`;
  } catch{
    // Child output, file contents, paths and adapter errors never enter public metadata.
  }
  if(!options.quiet) {
    deps.report(message);
  }
  const result: DeploymentEnvResult = {completed, pending, ...(plan ? {plan} : {}), status};
  callback?.(status);
  return result;
};

export const deploymentEnvFromArgs = async (
  mode: DeploymentEnvMode,
  args: readonly string[],
  descriptorPath: string,
  callback?: (status: number) => void
): Promise<DeploymentEnvResult> => {
  let options: DeploymentEnvOptions;
  try {
    options = parseDeploymentEnvArgs(mode, args, descriptorPath);
  } catch{
    reportDefault('Invalid deployment options');
    callback?.(1);
    return {completed: [], pending: [], status: 1};
  }
  return deploymentEnv(options, callback);
};
