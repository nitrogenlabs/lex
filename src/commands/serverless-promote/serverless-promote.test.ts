import {beforeEach, describe, expect, it, vi} from 'vitest';

import {serverlessPromote} from './serverless-promote.js';

const {aws, log} = vi.hoisted(() => ({aws: vi.fn(), log: vi.fn()}));
vi.mock('execa', () => ({execa: aws}));
vi.mock('../../utils/log.js', () => ({log}));

const options = {alias: 'dev', expectedCodeSha256: 'bundle-hash', expectedRevision: 'function-revision', expectedVersion: '1', functionName: 'phantazeApiMessageWebsocket', region: 'us-east-1'};
let alias: Record<string, unknown>;
let configuration: Record<string, unknown>;
let published: string[];
let failOperation: string;
let publishedVersion: string;
let ready: boolean;

beforeEach(() => {
  vi.clearAllMocks();
  alias = {FunctionVersion: '1', RevisionId: 'alias-revision'};
  configuration = {CodeSha256: 'bundle-hash', LastUpdateStatus: 'Successful', RevisionId: 'function-revision', State: 'Active'};
  published = [];
  failOperation = '';
  publishedVersion = '2';
  ready = false;
  aws.mockImplementation(async (_command: string, args: string[]) => {
    const operation = args[1];
    if(operation === failOperation) {
      throw new Error('AWS failure with secret payload');
    }
    if(operation === 'get-alias') {
      return {stdout: JSON.stringify(alias)};
    }
    if(operation === 'get-function-configuration') {
      return {stdout: JSON.stringify(configuration)};
    }
    if(operation === 'publish-version') {
      if(args[args.indexOf('--revision-id') + 1] !== 'function-revision' || args[args.indexOf('--code-sha256') + 1] !== 'bundle-hash') {
        throw new Error('Missing snapshot guards');
      }
      published.push('2');
      return {stdout: JSON.stringify({Version: publishedVersion})};
    }
    if(operation === 'wait') {
      if(args[2] !== 'function-active-v2' || args[args.indexOf('--qualifier') + 1] !== '2') {
        throw new Error('Wrong readiness target');
      }
      ready = true;
      return {stdout: ''};
    }
    if(operation === 'update-alias') {
      if(!ready) {
        throw new Error('Published version is pending');
      }
      if(args[args.indexOf('--revision-id') + 1] !== 'alias-revision' || args[args.indexOf('--name') + 1] !== 'dev') {
        throw new Error('Wrong alias or missing concurrency guard');
      }
      alias.FunctionVersion = args[args.indexOf('--function-version') + 1];
      return {stdout: JSON.stringify(alias)};
    }
    throw new Error(`Unexpected operation ${operation}`);
  });
});

describe('serverless promotion', () => {
  it('publishes guarded code and advances only the selected alias', async () => {
    expect(await serverlessPromote(options)).toBe(0);
    expect(published).toEqual(['2']);
    expect(alias.FunctionVersion).toBe('2');
  });

  it('refuses an invalid published version without advancing the alias', async () => {
    publishedVersion = '$LATEST';

    expect(await serverlessPromote(options)).toBe(1);
    expect(alias.FunctionVersion).toBe('1');
  });

  it('dry runs inspect the target without publishing or moving it', async () => {
    expect(await serverlessPromote({...options, dryRun: true})).toBe(0);
    expect(published).toEqual([]);
    expect(alias.FunctionVersion).toBe('1');
  });

  it.each([
    {alias: ''}, {alias: '123'}, {alias: '$LATEST'}, {expectedVersion: ''},
    {expectedCodeSha256: ''}, {expectedRevision: ''}, {expectedVersion: '$LATEST'}, {functionName: ''}, {functionName: 'name:prod'}, {region: ''}
  ])('rejects invalid input before contacting AWS: %j', async (invalid) => {
    expect(await serverlessPromote({...options, ...invalid})).toBe(1);
    expect(aws).not.toHaveBeenCalled();
  });

  it.each([
    {FunctionVersion: '7'}, {RevisionId: ''}, {RoutingConfig: {AdditionalVersionWeights: {3: 0.1}}}
  ])('preserves an unexpected or weighted alias: %j', async (invalid) => {
    alias = {...alias, ...invalid};

    expect(await serverlessPromote(options)).toBe(1);
    expect(published).toEqual([]);
  });

  it.each([
    {expectedCodeSha256: 'another-bundle'}, {expectedRevision: 'another-deployment'}
  ])('refuses to promote a different deployment: %j', async (invalid) => {
    expect(await serverlessPromote({...options, ...invalid})).toBe(1);
    expect(published).toEqual([]);
    expect(alias.FunctionVersion).toBe('1');
  });

  it.each([
    {State: 'Pending'}, {LastUpdateStatus: 'InProgress'}, {RevisionId: ''}, {CodeSha256: ''}
  ])('refuses an unready function snapshot: %j', async (invalid) => {
    configuration = {...configuration, ...invalid};

    expect(await serverlessPromote(options)).toBe(1);
    expect(published).toEqual([]);
  });

  it.each(['get-alias', 'get-function-configuration', 'publish-version', 'wait', 'update-alias'])('reports %s failure without moving the alias or logging AWS payloads', async (operation) => {
    failOperation = operation;
    const callback = vi.fn();

    expect(await serverlessPromote(options, callback)).toBe(1);
    expect(callback).toHaveBeenCalledWith(1);
    expect(alias.FunctionVersion).toBe('1');
    expect(JSON.stringify(log.mock.calls)).not.toContain('secret payload');
  });
});
