import {describe, expect, it, test} from 'vitest';

import {parseDeploymentEnvDescriptor, parseDeploymentEnvText, resolveDeploymentEnvValue, validateDeploymentEnvStage} from './environment.js';

export const descriptor = {schemaVersion: 1, setup: {optionalVariableNames: ['O'], requiredSecretNames: ['S'], requiredVariableNames: ['A']}, stages: {dev: {defaults: {A: 'default'}, environment: 'development'}, prod: {defaults: {A: 'default'}, environment: 'production'}}, validation: {optionalVariableNames: [], requiredSecretNames: ['S'], requiredVariableNames: ['A']}} as const;

describe('deployment environment', () => {
  it('parses supported simple dotenv syntax preserving bytes', () => {
    expect(parseDeploymentEnvText('A=\'x=y\'\r\n# ignored\r\nexport B=z\ninvalid\nA=" a=b \'\nEMPTY=\n_X=z')).toEqual({A: ' a=b ', EMPTY: '', _X: 'z'});
  });

  it('resolves every precedence layer with truthy semantics', () => {
    const layers: readonly [
      Readonly<Record<string, string>>,
      Readonly<Record<string, string>>,
      Readonly<Record<string, string>>
    ] = [{A: 'file', DEV_A: 'file-stage'}, {A: 'process', DEV_A: 'process-stage'}, {A: 'default'}];

    expect(resolveDeploymentEnvValue('dev', 'A', 'setup', layers[0], layers[1], layers[2])).toBe('file-stage');
    expect(resolveDeploymentEnvValue('dev', 'A', 'setup', {A: 'file'}, layers[1], layers[2])).toBe('process-stage');
    expect(resolveDeploymentEnvValue('dev', 'A', 'setup', {A: 'file'}, {A: 'process'}, layers[2])).toBe('file');
    expect(resolveDeploymentEnvValue('dev', 'A', 'setup', {}, {A: 'process'}, layers[2])).toBe('process');
    expect(resolveDeploymentEnvValue('dev', 'A', 'setup', {DEV_A: ''}, {}, layers[2])).toBe('default');
    expect(resolveDeploymentEnvValue('dev', 'A', 'setup', {DEV_A: ' '}, {A: 'ok'}, layers[2])).toBe(' ');
    expect(resolveDeploymentEnvValue('dev', 'ARANGODB_URL', 'setup', {DEV_ARANGODB_URL: 'fixture-override'}, {}, {})).toBe('fixture-override');
    expect(resolveDeploymentEnvValue('dev', 'A', 'setup', {}, {}, {})).toBe('');
    expect(resolveDeploymentEnvValue('dev', 'A', 'validate', {A: 'file'}, {A: 'process'}, {})).toBe('file');
    expect(resolveDeploymentEnvValue('dev', 'A', 'validate', {}, {A: 'process'}, {})).toBe('process');
    expect(resolveDeploymentEnvValue('dev', 'A', 'validate', {}, {}, layers[2])).toBe('');
  });

  it('validates phase requirements and rules', () => {
    expect(validateDeploymentEnvStage(descriptor, 'dev', 'validate', {A: ' ', S: ''})).toEqual(['S', 'A']);

    const rules = {...descriptor, stages: {dev: {...descriptor.stages.dev, validationRules: [{expected: 'url', name: 'A', normalization: 'trailing-slashes' as const}]}}};

    expect(validateDeploymentEnvStage(rules, 'dev', 'validate', {A: 'url///', S: 'ok'})).toEqual([]);
    expect(validateDeploymentEnvStage(rules, 'dev', 'validate', {A: 'wrong', S: 'ok'})).toEqual(['A']);
    expect(validateDeploymentEnvStage(rules, 'dev', 'setup', {A: 'wrong', S: 'ok'})).toEqual([]);
  });

  it('accepts schema and rejects invalid structures without echo', () => {
    expect(parseDeploymentEnvDescriptor(JSON.stringify(descriptor))).toEqual(descriptor);

    const invalid = [null, [], {...descriptor, schemaVersion: 2}, {...descriptor, extra: 'sentinel'}, {...descriptor, repository: '../x'}, {...descriptor, setup: {...descriptor.setup, requiredSecretNames: ['S','S']}}, {...descriptor, setup: {...descriptor.setup, requiredSecretNames: ['A']}}, {...descriptor, stages: {}}, {...descriptor, stages: {'../dev': descriptor.stages.dev}}, {...descriptor, stages: {dev: {...descriptor.stages.dev, defaults: {S: 'sentinel'}}}}, {...descriptor, stages: {dev: {...descriptor.stages.dev, environment: '../env'}}}, {...descriptor, validation: {requiredSecretNames: []}}, {...descriptor, stages: {dev: {...descriptor.stages.dev, validationRules: [{expected: 'x', name: 'S', normalization: 'none'}]}}}];
    for(const value of invalid) {
      expect(() => parseDeploymentEnvDescriptor(JSON.stringify(value))).toThrow('Invalid deployment descriptor');
    }

    expect(() => parseDeploymentEnvDescriptor('sentinel')).toThrow('Invalid deployment descriptor');
  });
});

test('rejects defaults for a name classified as secret in either phase', () => {
  const invalid = {...descriptor, stages: {dev: {defaults: {S: 'sentinel'}, environment: 'dev'}}, validation: {optionalVariableNames: [], requiredSecretNames: [], requiredVariableNames: ['S']}};

  expect(() => parseDeploymentEnvDescriptor(JSON.stringify(invalid))).toThrow('Invalid deployment descriptor');
});

test('rejects nonstring validation normalization without coercion', () => {
  for(const normalization of [['trailing-slashes'], ['none'], null, 1, {}, true]) {
    const invalid = {...descriptor, stages: {dev: {...descriptor.stages.dev, validationRules: [{expected: 'url', name: 'A', normalization}]}}};

    expect(() => parseDeploymentEnvDescriptor(JSON.stringify(invalid))).toThrow('Invalid deployment descriptor');
  }
});
