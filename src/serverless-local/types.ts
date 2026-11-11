/** Secret-free identities for one explicitly configured local function. */
export type LocalInvocationMetadata = Readonly<{
  accountId: string;
  apiId: string;
  functionArn: string;
  payloadVersion?: '2.0';
  region: string;
  stage: string;
  timeoutMs: number;
}>;
export type LocalFunctionDeclaration = Readonly<{
  events?: readonly {readonly http?: {readonly method?: string; readonly path?: string}}[];
  handler: string;
  localInvocation?: LocalInvocationMetadata;
}>;
export type LocalInvocationContext = Readonly<{
  functionName: string;
  functionVersion: string;
  getRemainingTimeInMillis: () => number;
  invokedFunctionArn: string;
}>;
/** Preserve each application's typed Lambda event; its handler remains the event admission authority. */
export type LocalHandler = {
  handle(event: unknown, context: LocalInvocationContext): unknown;
}['handle'];
export type LocalInvoke = (name: string, event: unknown) => Promise<unknown>;
export type LocalBootstrapBindings = Readonly<{
  close?: () => void | Promise<void>;
  handlers: Readonly<Record<string, LocalHandler>>;
}>;
export type LocalBootstrap = (ports: Readonly<{invoke: LocalInvoke}>) =>
  LocalBootstrapBindings | Promise<LocalBootstrapBindings>;
export type LocalFunction = Readonly<{
  events: readonly {readonly method: string; readonly path: string}[];
  handler: string;
  localInvocation: LocalInvocationMetadata;
  name: string;
}>;
export type LocalHttpRequest = Readonly<{
  body: Uint8Array;
  headers: Readonly<Record<string, string | readonly string[] | undefined>>;
  method: string;
  rawHeaders?: readonly string[];
  sourceIp: string;
  target: string;
}>;
