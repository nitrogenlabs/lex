import {captureLocalFunctions} from './http.js';

import type {LocalBootstrap, LocalBootstrapBindings, LocalFunctionDeclaration, LocalHandler, LocalInvoke} from './types.js';

/** Pure injected orchestration: no listeners, credentials, retries, queue protocol or ambient configuration. */
export const createServerlessLocalRuntime = async ({bootstrap, functions: declarations, loadHandler,
  maxConcurrentInvocations, now = Date.now}: {
  bootstrap?: LocalBootstrap;
  functions: Readonly<Record<string, LocalFunctionDeclaration>>;
  loadHandler: (path: string) => Promise<LocalHandler>;
  maxConcurrentInvocations: number;
  now?: () => number;
}) => {
  if(!Number.isSafeInteger(maxConcurrentInvocations)
    || maxConcurrentInvocations < 1 || maxConcurrentInvocations > 1024) {
    throw new Error('Invalid local invocation capacity');
  }
  const functions = captureLocalFunctions(declarations);
  const handlers = new Map<string, Promise<LocalHandler>>();
  const pending = new Set<Promise<unknown>>();
  let bindings: LocalBootstrapBindings | undefined;
  let ready = false;
  let closed = false;
  let closing: Promise<void> | undefined;
  const invoke: LocalInvoke = async (name, event) => {
    if(closed) {
      throw new Error('Local runtime closed');
    }
    if(!ready) {
      throw new Error('Local runtime not ready');
    }
    const entry = functions.find((item) => item.name === name);
    if(!entry) {
      throw new Error('Unknown local function');
    }
    if(pending.size >= maxConcurrentInvocations) {
      throw new Error('Local invocation capacity exceeded');
    }
    let capturedEvent: unknown;
    try {
      capturedEvent = structuredClone(event);
    } catch{
      throw new Error('Invalid local invocation event');
    }
    const startedAt = now();
    const {functionArn, timeoutMs} = entry.localInvocation;
    const run = async () => {
      try {
        let handler = handlers.get(name);
        if(!handler) {
          handler = loadHandler(entry.handler);
          handlers.set(name, handler);
        }
        return await (await handler)(capturedEvent, Object.freeze({functionName: name,
          functionVersion: functionArn.split(':').at(-1)!,
          getRemainingTimeInMillis: () => Math.max(0, Math.min(timeoutMs, timeoutMs - (now() - startedAt))),
          invokedFunctionArn: functionArn}));
      } catch{
        throw new Error('Local invocation unavailable');
      }
    };
    const work = run();
    pending.add(work);
    try {
      return await work;
    } finally {
      pending.delete(work);
    }
  };
  if(bootstrap) {
    try {
      bindings = await bootstrap(Object.freeze({invoke}));
    } catch{
      throw new Error('Local bootstrap unavailable');
    }
    if(!bindings || !bindings.handlers || typeof bindings.handlers !== 'object'
      || Object.entries(bindings.handlers).some(([name, handler]) => typeof handler !== 'function' || !functions.some((entry) => entry.name === name))
      || (bindings.close !== undefined && typeof bindings.close !== 'function')) {
      try {
        if(typeof bindings?.close === 'function') {
          await bindings.close();
        }
      } catch{
        // Invalid startup always retains its sanitized diagnostic.
      }
      throw new Error('Invalid local bootstrap bindings');
    }
    for(const [name, handler] of Object.entries(bindings.handlers)) {
      handlers.set(name, Promise.resolve(handler));
    }
    bindings = Object.freeze({...bindings});
  }
  ready = true;
  return Object.freeze({close: (): Promise<void> => {
    closed = true;
    closing ??= Promise.allSettled([...pending]).then(async () => {
      await bindings?.close?.();
    });
    return closing;
  }, functions, invoke});
};
