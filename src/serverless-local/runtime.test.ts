import {describe, expect, it, vi} from 'vitest';

import {createServerlessLocalRuntime} from './runtime.js';

const metadata = {accountId: '123456789012', apiId: 'local', functionArn: 'arn:aws:lambda:us-east-1:123456789012:function:worker:7', region: 'us-east-1', stage: 'local', timeoutMs: 30000};
const functions = () => ({worker: {handler: 'index.worker', localInvocation: metadata}});

describe('bounded local function invocation', () => {
  it('injects exact declared identity and elapsed invocation budget', async () => {
    let time = 1000;
    const runtime = await createServerlessLocalRuntime({functions: functions(),
      loadHandler: async () => async (event, context) => {
        expect(context).toMatchObject({functionName: 'worker', functionVersion: '7', invokedFunctionArn: metadata.functionArn});
        expect(context.getRemainingTimeInMillis()).toBe(30000);

        time += 100;

        expect(context.getRemainingTimeInMillis()).toBe(29900);

        return event;
      }, maxConcurrentInvocations: 1, now: () => time});

    expect(await runtime.invoke('worker', {version: 2})).toEqual({version: 2});

    await runtime.close();
  });

  it('bootstraps explicit handler ports and invokes queued work exactly once without retry', async () => {
    const worker = vi.fn(async () => {
      throw new Error('private provider outcome');
    });
    const close = vi.fn();
    const runtime = await createServerlessLocalRuntime({bootstrap: async ({invoke}) => {
      await expect(invoke('worker', {})).rejects.toThrow('Local runtime not ready');

      return {close, handlers: {worker}};
    }, functions: functions(), loadHandler: vi.fn(), maxConcurrentInvocations: 1});

    await expect(runtime.invoke('worker', {Records: []})).rejects.toThrow('Local invocation unavailable');
    expect(worker).toHaveBeenCalledOnce();

    await runtime.close();
    await runtime.close();

    expect(close).toHaveBeenCalledOnce();
    await expect(runtime.invoke('worker', {})).rejects.toThrow('Local runtime closed');
  });

  it('bounds concurrent execution and waits for original in-flight work before closing ports', async () => {
    let release!: () => void;
    const started = Promise.withResolvers<undefined>();
    const close = vi.fn();
    const runtime = await createServerlessLocalRuntime({bootstrap: async () => ({close, handlers: {worker: async () => {
      started.resolve(undefined);
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return 'accepted';
    }}}), functions: functions(), loadHandler: vi.fn(), maxConcurrentInvocations: 1});
    const work = runtime.invoke('worker', {});
    await started.promise;

    await expect(runtime.invoke('worker', {})).rejects.toThrow('Local invocation capacity exceeded');

    const closing = runtime.close();

    expect(close).not.toHaveBeenCalled();

    release();

    expect(await work).toBe('accepted');

    await closing;

    expect(close).toHaveBeenCalledOnce();
  });

  it('refuses undeclared functions and malformed bootstrap bindings', async () => {
    const runtime = await createServerlessLocalRuntime({functions: functions(), loadHandler: vi.fn(),
      maxConcurrentInvocations: 1});

    await expect(runtime.invoke('legacy', {})).rejects.toThrow('Unknown local function');

    await runtime.close();

    await expect(createServerlessLocalRuntime({bootstrap: async () => ({handlers: {legacy: async () => null}}), functions: functions(), loadHandler: vi.fn(), maxConcurrentInvocations: 1})).rejects.toThrow('Invalid local bootstrap bindings');
    await expect(createServerlessLocalRuntime({functions: functions(), loadHandler: vi.fn(), maxConcurrentInvocations: 0})).rejects.toThrow('Invalid local invocation capacity');
  });

  it('sanitizes bootstrap errors and closes invalid bootstrap resources', async () => {
    const options = {functions: functions(), loadHandler: vi.fn(), maxConcurrentInvocations: 1};

    await expect(createServerlessLocalRuntime({...options, bootstrap: async () => {
      throw new Error('secret-password');
    }})).rejects.toThrow('Local bootstrap unavailable');

    const close = vi.fn();

    await expect(createServerlessLocalRuntime({...options, bootstrap: async () => ({close, handlers: {unknown: vi.fn()}})})).rejects.toThrow('Invalid local bootstrap bindings');
    expect(close).toHaveBeenCalledOnce();
  });

  it('captures the original event before asynchronous loading and rejects unserializable invocations', async () => {
    const original = {Records: [{body: 'original-command'}]};
    const runtime = await createServerlessLocalRuntime({functions: functions(),
      loadHandler: async () => async (event) => event, maxConcurrentInvocations: 1});
    const pending = runtime.invoke('worker', original);
    original.Records[0].body = 'changed-command';

    expect(await pending).toEqual({Records: [{body: 'original-command'}]});
    await expect(runtime.invoke('worker', {callback: () => {}})).rejects.toThrow('Invalid local invocation event');

    await runtime.close();
  });
});
