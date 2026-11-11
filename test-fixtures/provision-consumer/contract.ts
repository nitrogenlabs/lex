import {provision} from '@nlabs/lex';

import type {ProvisionOperation, ProvisionOptions} from '@nlabs/lex';

export const accepted: readonly ProvisionOperation[] = ['artifact-publish', 'cloudfront-api-routing', 'stack-create', 'stack-update', 'ui-publish'];
export const publicContract = (operation: ProvisionOperation): void => {
  const options: ProvisionOptions = {args: ['--mode', 'plan'], cwd: '/caller', operation};
  const result: Promise<number> = provision(options);
  void result;
};

// @ts-expect-error -- unrelated provider operations remain unsupported.
export const unsupported: ProvisionOperation = 'lambda-update';
