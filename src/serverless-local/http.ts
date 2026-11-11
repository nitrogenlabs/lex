import {isIP} from 'node:net';

import type {LocalFunction, LocalFunctionDeclaration, LocalHttpRequest, LocalInvocationMetadata} from './types.js';

const invalid = (): never => {
  throw new Error('Invalid local function configuration');
};
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 256;
const pathShape = (path: string) => path.replace(/\{[A-Za-z][A-Za-z0-9_]*\}/g, '{}');

/** Capture only opted-in functions; legacy declarations retain the existing emulator. */
export const captureLocalFunctions = (
  input: Readonly<Record<string, LocalFunctionDeclaration>>
): readonly LocalFunction[] => {
  const functions: LocalFunction[] = [];
  const routes = new Set<string>();
  const templates: {method: string; path: string; stage: string}[] = [];
  for(const [name, entry] of Object.entries(input)) {
    if(entry.localInvocation === undefined) {
      continue;
    }
    const metadata: unknown = entry.localInvocation;
    if(!object(metadata) || Object.keys(metadata).some((key) => !['accountId', 'apiId', 'functionArn',
      'payloadVersion', 'region', 'stage', 'timeoutMs'].includes(key))
      || !text(entry.handler) || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(name)
      || !text(metadata.accountId) || !/^\d{12}$/.test(metadata.accountId)
      || !text(metadata.apiId) || !/^[A-Za-z0-9_-]+$/.test(metadata.apiId)
      || !text(metadata.region) || !/^[a-z0-9-]+$/.test(metadata.region)
      || !text(metadata.stage) || !/^[A-Za-z0-9_$-]+$/.test(metadata.stage)
      || !text(metadata.functionArn) || !new RegExp(`^arn:aws:lambda:${metadata.region}:${metadata.accountId}:function:[A-Za-z0-9_-]+:[1-9][0-9]{0,15}$`).test(metadata.functionArn)
      || !Number.isSafeInteger(metadata.timeoutMs)
      || Number(metadata.timeoutMs) < 1 || Number(metadata.timeoutMs) > 900000
      || (metadata.payloadVersion !== undefined && metadata.payloadVersion !== '2.0')) {
      return invalid();
    }
    const {stage} = metadata;
    const events = (entry.events ?? []).flatMap((event) => {
      if(!event.http) {
        return [];
      }
      const {method, path} = event.http;
      if(!text(method) || !/^[A-Z]+$/.test(method) || !text(path) || !path.startsWith('/')
        || /[\x00-\x20\x7f?#\\]/.test(path)
        || path.split('/').some((segment) => /[{}]/.test(segment) && !/^\{[A-Za-z][A-Za-z0-9_]*\}$/.test(segment))) {
        return invalid();
      }
      const key = `${stage}:${method}:${pathShape(path)}`;
      if(routes.has(key)) {
        throw new Error('Ambiguous local HTTP route');
      }
      if(path.includes('{')) {
        const segments = path.split('/');
        if(templates.some((route) => route.method === method && route.stage === stage
          && route.path.split('/').length === segments.length
          && route.path.split('/').every((part, index) => part === segments[index]
            || part.startsWith('{') || segments[index].startsWith('{')))) {
          throw new Error('Ambiguous local HTTP route');
        }
        templates.push({method, path, stage});
      }
      routes.add(key);
      return [Object.freeze({method, path})];
    });
    functions.push(Object.freeze({events: Object.freeze(events), handler: entry.handler,
      localInvocation: Object.freeze({...metadata}) as LocalInvocationMetadata, name}));
  }
  return Object.freeze(functions);
};

/** Exact paths win over templates regardless of declaration ordering. Never decode targets. */
export const matchLocalHttpRoute = (
  functions: readonly LocalFunction[], method: string, target: string
): LocalFunction | undefined => {
  const rawPath = target.split('?')[0];
  let template: LocalFunction | undefined;
  for(const entry of functions) {
    if(entry.localInvocation.payloadVersion !== '2.0') {
      continue;
    }
    const prefix = `/${entry.localInvocation.stage}`;
    const path = entry.localInvocation.stage !== '$default' && rawPath.startsWith(`${prefix}/`) ? rawPath.slice(prefix.length) : rawPath;
    for(const event of entry.events) {
      if(event.method !== method) {
        continue;
      }
      if(event.path === path) {
        return entry;
      }
      const expected = event.path.split('/');
      const actual = path.split('/');
      if(expected.length === actual.length && expected.every((part, index) => part === actual[index]
        || (part.startsWith('{') && actual[index] !== ''))) {
        template ??= entry;
      }
    }
  }
  return template;
};

/** Raw bytes are base64 encoded even for JSON: parsing belongs to the deployed handler. */
export const createLocalHttpApiV2Event = (request: LocalHttpRequest, metadata: LocalInvocationMetadata) => {
  if(!isIP(request.sourceIp)) {
    throw new Error('Invalid local source address');
  }
  const separator = request.target.indexOf('?');
  const rawPath = separator < 0 ? request.target : request.target.slice(0, separator);
  const rawQueryString = separator < 0 ? '' : request.target.slice(separator + 1);
  const headers: Record<string, string> = Object.create(null);
  let cookies: string[] | undefined;
  let observed = request.headers;
  if(request.rawHeaders !== undefined) {
    if(request.rawHeaders.length % 2 !== 0) {
      throw new Error('Invalid local wire headers');
    }
    const wire: Record<string, string> = Object.create(null);
    for(let index = 0; index < request.rawHeaders.length; index += 2) {
      const name = request.rawHeaders[index].toLowerCase();
      const value = request.rawHeaders[index + 1];
      wire[name] = wire[name] === undefined ? value : `${wire[name]}${name === 'cookie' ? '; ' : ','}${value}`;
    }
    observed = wire;
  }
  for(const [key, value] of Object.entries(observed)) {
    const name = key.toLowerCase();
    if(value === undefined || ['connection', 'expect', 'te', 'trailer', 'transfer-encoding', 'upgrade'].includes(name)) {
      continue;
    }
    const combined = typeof value === 'string' ? value : value.join(name === 'cookie' ? '; ' : ',');
    if(name === 'cookie') {
      cookies = combined.split(/;\s*/);
    } else {
      headers[name] = combined;
    }
  }
  return {body: Buffer.from(request.body).toString('base64'), ...cookies ? {cookies} : {}, headers,
    isBase64Encoded: true, rawPath, rawQueryString,
    requestContext: {accountId: metadata.accountId, apiId: metadata.apiId,
      http: {method: request.method, path: rawPath, sourceIp: request.sourceIp}, stage: metadata.stage}, version: '2.0'};
};

/** Validate the Lambda envelope before writing any headers or bytes to the socket. */
export const localHttpResponse = (
  value: unknown
): {body: Buffer; headers: Record<string, string | string[]>; statusCode: number} => {
  const fail = (): never => {
    throw new Error('Invalid local HTTP response');
  };
  if(!object(value)) {
    return fail();
  }
  const {body = '', cookies, headers = {}, isBase64Encoded = false, statusCode = 200} = value;
  if(typeof body !== 'string' || typeof isBase64Encoded !== 'boolean' || !Number.isInteger(statusCode)
    || Number(statusCode) < 100 || Number(statusCode) > 599 || !object(headers)
    || (cookies !== undefined && (!Array.isArray(cookies) || cookies.some((cookie) => typeof cookie !== 'string' || /[\r\n]/.test(cookie))))) {
    return fail();
  }
  const output: Record<string, string | string[]> = Object.create(null);
  for(const [key, header] of Object.entries(headers)) {
    if(!/^[!#$%&'*+.^_`|~\da-z-]+$/i.test(key) || !['string', 'number', 'boolean'].includes(typeof header)
      || /[\r\n]/.test(String(header))) {
      return fail();
    }
    output[key.toLowerCase()] = String(header);
  }
  if(Array.isArray(cookies)) {
    output['set-cookie'] = [...cookies];
  }
  const bytes = Buffer.from(body, isBase64Encoded ? 'base64' : 'utf8');
  if(isBase64Encoded && bytes.toString('base64') !== body) {
    return fail();
  }
  return {body: bytes, headers: output, statusCode: Number(statusCode)};
};
