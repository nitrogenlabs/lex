import {createServerlessLocalRuntime, type LocalBootstrap, type LocalHandler,
  type LocalInvocationContext} from '@nlabs/lex/serverless-local';

type QueueEvent = {Records: {body: string}[]};
const worker = async (event: QueueEvent, context: Pick<LocalInvocationContext,
  'getRemainingTimeInMillis' | 'invokedFunctionArn'>) => ({body: event.Records[0].body,
  remaining: context.getRemainingTimeInMillis()});
const typedWorker: LocalHandler = worker;
const bootstrap: LocalBootstrap = ({invoke}) => {
  const invalidInvocation = () => {
    // @ts-expect-error The callback must infer a string function name, never `any`.
    void invoke(42, {});
  };
  void invalidInvocation;
  return {close: async () => {
    await Promise.resolve();
  }, handlers: {worker: typedWorker}};
};

/** Compile-only consumer: typed app callbacks bind directly to the public lean export. */
export const qualifyLocalConsumer = async () => {
  const runtime = await createServerlessLocalRuntime({bootstrap,
    functions: {worker: {handler: 'index.worker', localInvocation: {accountId: '123456789012', apiId: 'local',
      functionArn: 'arn:aws:lambda:us-east-1:123456789012:function:worker:17', region: 'us-east-1',
      stage: 'local', timeoutMs: 30000}}}, loadHandler: async () => worker, maxConcurrentInvocations: 2});
  const result: unknown = await runtime.invoke('worker', {Records: [{body: 'original-command'}]});
  await runtime.close();
  return result;
};
