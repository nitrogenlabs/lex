/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';

import {log} from '../../utils/log.js';

export interface ServerlessPromoteOptions {
  readonly alias: string;
  readonly dryRun?: boolean;
  readonly expectedCodeSha256: string;
  readonly expectedRevision: string;
  readonly expectedVersion: string;
  readonly functionName: string;
  readonly quiet?: boolean;
  readonly region: string;
}

interface LambdaAlias {
  FunctionVersion?: string;
  RevisionId?: string;
  RoutingConfig?: {AdditionalVersionWeights?: Record<string, number>};
}

interface LambdaSnapshot {
  CodeSha256?: string;
  LastUpdateStatus?: string;
  RevisionId?: string;
  State?: string;
  Version?: string;
}

export const serverlessPromote = async (
  options: ServerlessPromoteOptions,
  callback: (status: number) => void = () => {}
): Promise<number> => {
  const {alias, dryRun, expectedCodeSha256, expectedRevision, expectedVersion, functionName, quiet, region} = options;
  let operation = 'validate';

  try {
    if(!/^[a-zA-Z0-9-_]{1,64}$/.test(functionName || '') ||
      !/^[a-zA-Z0-9-_]{1,128}$/.test(alias || '') || /^\d+$/.test(alias) ||
      !/^[1-9]\d*$/.test(expectedVersion || '') || !expectedCodeSha256 || !expectedRevision || !region?.trim()) {
      throw new Error('Invalid promotion options');
    }

    const aws = async <T>(command: string, args: string[], query: string): Promise<T> => {
      operation = command;
      const result = await execa('aws', [
        'lambda', command, '--function-name', functionName,
        ...args, '--region', region, '--query', query, '--output', 'json', '--no-cli-pager'
      ]);
      return JSON.parse(result.stdout) as T;
    };

    const currentAlias = await aws<LambdaAlias>('get-alias', ['--name', alias],
      '{FunctionVersion:FunctionVersion,RevisionId:RevisionId,RoutingConfig:RoutingConfig}');
    if(currentAlias.FunctionVersion !== expectedVersion || !currentAlias.RevisionId ||
      Object.keys(currentAlias.RoutingConfig?.AdditionalVersionWeights || {}).length) {
      throw new Error('Alias baseline changed or uses weighted routing');
    }

    const snapshot = await aws<LambdaSnapshot>('get-function-configuration', [],
      '{CodeSha256:CodeSha256,LastUpdateStatus:LastUpdateStatus,RevisionId:RevisionId,State:State}');
    if(snapshot.State !== 'Active' || snapshot.LastUpdateStatus !== 'Successful' ||
      snapshot.CodeSha256 !== expectedCodeSha256 || snapshot.RevisionId !== expectedRevision) {
      throw new Error('Function is not ready');
    }

    if(dryRun) {
      log(`Lex promotion dry run: ${functionName}:${alias} currently targets version ${expectedVersion}.`, 'info', quiet);
    } else {
      const published = await aws<LambdaSnapshot>('publish-version', [
        '--code-sha256', snapshot.CodeSha256, '--revision-id', snapshot.RevisionId
      ], '{Version:Version}');
      if(!/^[1-9]\d*$/.test(published.Version || '')) {
        throw new Error('Invalid published version');
      }
      operation = 'wait';
      await execa('aws', [
        'lambda', 'wait', 'function-active-v2', '--function-name', functionName,
        '--qualifier', published.Version!, '--region', region, '--no-cli-pager'
      ]);
      await aws<LambdaAlias>('update-alias', [
        '--name', alias, '--function-version', published.Version!, '--revision-id', currentAlias.RevisionId
      ], '{FunctionVersion:FunctionVersion}');
      log(`Lex promoted ${functionName}:${alias} from version ${expectedVersion} to ${published.Version}.`, 'success', quiet);
    }
  } catch{
    // AWS errors can contain command output, including sensitive configuration.
    log(`Lex promotion stopped during ${operation}; promotion could not be confirmed. Check the selected alias before retrying.`, 'error', quiet);
    callback(1);
    return 1;
  }

  callback(0);
  return 0;
};
