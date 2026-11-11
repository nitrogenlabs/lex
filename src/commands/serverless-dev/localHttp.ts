import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

import {createLocalHttpApiV2Event, localHttpResponse, matchLocalHttpRoute} from '../../serverless-local/http.js';
import {createServerlessLocalRuntime} from '../../serverless-local/runtime.js';

import type {LocalBootstrap, LocalFunctionDeclaration, LocalHandler} from '../../serverless-local/types.js';

type Incoming = {body?: unknown; headers: Record<string, string | readonly string[] | undefined>; method: string;
  originalUrl: string; rawHeaders?: readonly string[]; socket: {remoteAddress?: string};};
type Outgoing = {end: (body: string | Buffer) => unknown;
  setHeader: (name: string, value: string | string[]) => unknown; statusCode: number;};

export type ServerlessLocalConfiguration = Readonly<{
  functions?: Readonly<Record<string, LocalFunctionDeclaration>>;
  local?: Readonly<{bootstrap?: string; maxConcurrentInvocations: number}>;
}>;

/** An opt-in configuration must be complete before a socket is opened. */
export const initializeLocalRuntime = async (config: ServerlessLocalConfiguration,
  load: (declaration: string) => Promise<unknown>) => {
  if(!config.local && !Object.values(config.functions ?? {}).some((entry) => entry.localInvocation)) {
    return undefined;
  }
  if(!config.local) {
    throw new Error('Explicit local invocation configuration required');
  }
  const {bootstrap: declaration, maxConcurrentInvocations} = config.local;
  const functions = structuredClone(config.functions ?? {});
  const bootstrap = declaration ? await load(declaration) : undefined;
  return createServerlessLocalRuntime({bootstrap: bootstrap as LocalBootstrap | undefined,
    functions, loadHandler: async (path) => await load(path) as LocalHandler, maxConcurrentInvocations});
};

/** Resolve compiled named exports without importing the CLI or exposing raw import diagnostics. */
export const createLocalExportLoader = (outputDirectory: string,
  importModule: (specifier: string) => Promise<Record<string, unknown>> = (specifier) => import(specifier)) =>
  async (declaration: string): Promise<unknown> => {
    try {
      const separator = declaration.lastIndexOf('.');
      if(separator < 1 || separator === declaration.length - 1) {
        throw new Error();
      }
      const file = declaration.slice(0, separator);
      const name = declaration.slice(separator + 1);
      const extension = /\.(?:js|mjs|cjs)$/.test(file) ? '' : '.js';
      const module = await importModule(pathToFileURL(resolve(outputDirectory, `${file}${extension}`)).href);
      const exported = module[name];
      if(typeof exported !== 'function') {
        throw new Error();
      }
      return exported;
    } catch{
      throw new Error('Local module export unavailable');
    }
  };

/** Run before generic parsers: only a matching opted-in route consumes its original bytes. */
export const createLocalHttpMiddleware = <Request extends Incoming, Response extends Outgoing>(
  runtime: Awaited<ReturnType<typeof createServerlessLocalRuntime>>,
  raw: (request: Request, response: Response, next: (error?: unknown) => void) => unknown
) => async (request: Request, response: Response, next: () => void): Promise<void> => {
  const route = matchLocalHttpRoute(runtime.functions, request.method, request.originalUrl);
  if(!route) {
    next();
    return;
  }
  const fail = (status: number, error: string) => {
    response.statusCode = status;
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({error}));
  };
  await new Promise<void>((resolveCompletion) => {
    const encoding = request.headers['content-encoding'];
    const restoreEncoding = () => {
      if(encoding !== undefined) {
        request.headers['content-encoding'] = encoding;
      }
    };
    try {
      // API Gateway forwards encoded entity bytes; body-parser must not inflate them.
      delete request.headers['content-encoding'];
      raw(request, response, (error) => {
        restoreEncoding();
        if(error || (request.body !== undefined && !Buffer.isBuffer(request.body))) {
          fail(400, 'Invalid local request');
          resolveCompletion();
          return;
        }
        const body = Buffer.isBuffer(request.body) ? request.body : Buffer.alloc(0);
        const run = async () => {
          try {
            const event = createLocalHttpApiV2Event({body,
              headers: request.headers, method: request.method, rawHeaders: request.rawHeaders,
              sourceIp: request.socket.remoteAddress ?? '',
              target: request.originalUrl}, route.localInvocation);
            const result = localHttpResponse(await runtime.invoke(route.name, event));
            response.statusCode = result.statusCode;
            for(const [name, value] of Object.entries(result.headers)) {
              response.setHeader(name, value);
            }
            response.end(result.body);
          } catch{
            fail(503, 'Local invocation unavailable');
          }
        };
        void run().finally(resolveCompletion);
      });
    } catch{
      restoreEncoding();
      fail(400, 'Invalid local request');
      resolveCompletion();
    }
  });
};
