import type {DeploymentEnvDescriptor, DeploymentEnvMode, DeploymentEnvValues} from '../../commands/deployment-env/deployment-env.types.js';

const settingName = /^[A-Za-z_][A-Za-z0-9_]*$/;
const stageName = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
export const isDeploymentEnvRepository = (value: string): boolean => /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value) && value.split('/').every((part) => part !== '.' && part !== '..');
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const keys = (value: Record<string, unknown>, allowed: readonly string[]): boolean => Object.keys(value).every((key) => allowed.includes(key));
const names = (value: unknown): value is string[] => Array.isArray(value) && value.every((name) => typeof name === 'string' && settingName.test(name));

export const parseDeploymentEnvDescriptor = (text: string): DeploymentEnvDescriptor => {
  try {
    const value: unknown = JSON.parse(text);
    if(!record(value) || !keys(value, ['repository', 'schemaVersion', 'setup', 'stages', 'validation']) || value.schemaVersion !== 1 || (value.repository !== undefined && (typeof value.repository !== 'string' || !isDeploymentEnvRepository(value.repository)))) throw new Error();
    const variables = new Set<string>();
    const secrets = new Set<string>();
    for(const phase of ['setup', 'validation']) {
      const requirement = value[phase];
      if(!record(requirement) || !keys(requirement, ['optionalVariableNames', 'requiredSecretNames', 'requiredVariableNames']) || !names(requirement.optionalVariableNames) || !names(requirement.requiredSecretNames) || !names(requirement.requiredVariableNames)) throw new Error();
      const all = [...requirement.optionalVariableNames, ...requirement.requiredSecretNames, ...requirement.requiredVariableNames];
      if(new Set(all).size !== all.length) throw new Error();
      for(const name of requirement.requiredSecretNames) secrets.add(name);
      for(const name of [...requirement.optionalVariableNames, ...requirement.requiredVariableNames]) variables.add(name);
    }
    if(!record(value.stages) || !Object.keys(value.stages).length) throw new Error();
    const validation = value.validation as Record<string, string[]>;
    for(const [name, stage] of Object.entries(value.stages)) {
      if(!stageName.test(name) || name === 'all' || !record(stage) || !keys(stage, ['defaults', 'environment', 'validationRules']) || typeof stage.environment !== 'string' || !stageName.test(stage.environment) || !record(stage.defaults) || !Object.entries(stage.defaults).every(([key, item]) => !secrets.has(key) && variables.has(key) && typeof item === 'string')) throw new Error();
      if(stage.validationRules !== undefined && (!Array.isArray(stage.validationRules) || !stage.validationRules.every((rule: unknown) => record(rule) && keys(rule, ['expected', 'name', 'normalization']) && typeof rule.expected === 'string' && typeof rule.name === 'string' && [...validation.requiredVariableNames, ...validation.optionalVariableNames].includes(rule.name) && typeof rule.normalization === 'string' && ['none', 'trailing-slashes'].includes(rule.normalization)))) throw new Error();
    }
    return value as unknown as DeploymentEnvDescriptor;
  } catch {
    throw new Error('Invalid deployment descriptor');
  }
};

export const parseDeploymentEnvText = (text: string): Record<string, string> => {
  const values: Record<string, string> = Object.create(null);
  for(const line of text.split(/\r?\n/)) {
    const match = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if(match) values[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  return values;
};

export const resolveDeploymentEnvValue = (stage: string, name: string, mode: DeploymentEnvMode, file: DeploymentEnvValues, processValues: DeploymentEnvValues, defaults: Readonly<Record<string, string>>): string => mode === 'validate'
  ? file[name] || processValues[name] || ''
  : file[`${stage.toUpperCase()}_${name}`] || processValues[`${stage.toUpperCase()}_${name}`] || file[name] || processValues[name] || defaults[name] || '';

export const validateDeploymentEnvStage = (descriptor: DeploymentEnvDescriptor, stage: string, mode: DeploymentEnvMode, values: Readonly<Record<string, string>>): readonly string[] => {
  const requirement = descriptor[mode === 'setup' ? 'setup' : 'validation'];
  const failures = [...requirement.requiredSecretNames, ...requirement.requiredVariableNames].filter((name) => !values[name]?.trim());
  if(mode === 'validate') {
    for(const rule of descriptor.stages[stage].validationRules || []) {
      const value = values[rule.name] || '';
      if((rule.normalization === 'trailing-slashes' ? value.replace(/\/+$/, '') : value) !== rule.expected && !failures.includes(rule.name)) failures.push(rule.name);
    }
  }
  return failures;
};
