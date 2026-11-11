import {expect, test} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {request} from 'node:http';
import {createServer} from 'node:net';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {gzipSync} from 'node:zlib';

const localPort = async () => {
  const server = createServer();
  await new Promise<void>((resolveReady) => server.listen(0, '127.0.0.1', resolveReady));
  const address = server.address();
  if(!address || typeof address === 'string') {
    throw new Error('Expected local test address');
  }
  await new Promise<void>((resolveClose, reject) => server.close((error) => (error ? reject(error) : resolveClose())));
  return address.port;
};

const wire = (port: number, path: string, body = Buffer.alloc(0), headers: string[] = [], method = 'POST') =>
  new Promise<{body: Buffer; headers: import('node:http').IncomingHttpHeaders; status: number}>((resolveReply, reject) => {
    const outgoing = request({headers: ['Host', '127.0.0.1', 'Content-Length', String(body.length), ...headers],
      hostname: '127.0.0.1', method, path, port}, (incoming) => {
      const chunks: Buffer[] = [];
      incoming.on('data', (chunk: Buffer) => chunks.push(chunk));
      incoming.on('end', () => resolveReply({body: Buffer.concat(chunks), headers: incoming.headers,
        status: incoming.statusCode!}));
    });
    outgoing.on('error', reject);
    outgoing.end(body);
  });

test('actual CLI preserves wire evidence, private replies and one-shot local worker invocation', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lex-local-e2e-'));
  const httpPort = await localPort();
  let wsPort = await localPort();
  if(wsPort === httpPort) {
    wsPort = await localPort();
  }
  const metadata = {accountId: '123456789012', apiId: 'local', region: 'us-east-1', stage: 'local', timeoutMs: 30000};
  const config = {outputPath: '.', serverless: {custom: {'serverless-offline': {host: '127.0.0.1', httpPort, wsPort}},
    functions: {core: {events: [{http: {method: 'POST', path: '/api/items/{id}'}},
      {http: {method: 'GET', path: '/api/health'}}, {http: {method: 'GET', path: '/api/binary'}},
      {http: {method: 'POST', path: '/api/queued'}},
      {http: {method: 'GET', path: '/api/universes/{universeId}/books/{bookId}/scenarios/{scenarioId}'}}], handler: 'index.core',
    localInvocation: {...metadata, functionArn: 'arn:aws:lambda:us-east-1:123456789012:function:core:17',
      payloadVersion: '2.0'}}, specific: {events: [{http: {method: 'GET',
      path: '/api/universes/{universeId}/books/{bookId}/scenarios/checkpoint-plan'}}], handler: 'index.specific',
    localInvocation: {...metadata, functionArn: 'arn:aws:lambda:us-east-1:123456789012:function:specific:19',
      payloadVersion: '2.0'}}, worker: {handler: 'index.worker', localInvocation: {...metadata,
      functionArn: 'arn:aws:lambda:us-east-1:123456789012:function:worker:23'}}},
    local: {bootstrap: 'bootstrap.create', maxConcurrentInvocations: 4}}};
  await writeFile(join(directory, 'package.json'), '{"name":"lex-local-e2e","private":true,"type":"module"}');
  await writeFile(join(directory, 'lex.config.mjs'), `export default ${JSON.stringify(config)};`);
  await writeFile(join(directory, 'block-network.mjs'), 'globalThis.fetch=async()=>{console.error("UNEXPECTED_OUTBOUND");throw new Error("Blocked external request")};');
  await writeFile(join(directory, 'bootstrap.js'), `export const create=({invoke})=>({handlers:{
    core:async(event,context)=>event.rawPath==='/api/binary'
      ?{body:'AP8BgA==',cookies:['__Host-one=opaque; HttpOnly; Secure','__Host-two=other; Secure'],isBase64Encoded:true,statusCode:206}
      :{body:JSON.stringify(event.rawPath==='/api/queued'?await invoke('worker',{Records:[{body:'original-command'}]}):{event,version:context.functionVersion}),statusCode:200},
    specific:async(event,context)=>({body:JSON.stringify({event,version:context.functionVersion}),statusCode:200}),
    worker:async(event,context)=>({command:event.Records[0].body,version:context.functionVersion})},close:()=>{}});`);
  const child = spawn(process.execPath, ['--import', join(directory, 'block-network.mjs'), resolve('lib/lex.js'),
    'serverless-dev', '--quiet'], {cwd: directory, env: {HOME: process.env.HOME, NODE_ENV: 'test',
    PATH: process.env.PATH},
  stdio: ['ignore', 'pipe', 'pipe']});
  let logs = '';
  child.stdout.on('data', (data: Buffer) => {
    logs += data.toString();
  });
  child.stderr.on('data', (data: Buffer) => {
    logs += data.toString();
  });
  try {
    await expect.poll(async () => {
      if(child.exitCode !== null) {
        throw new Error(`Local fixture exited (${child.exitCode}); see attached startup output`);
      }
      try {
        return (await wire(httpPort, '/api/health', undefined, undefined, 'GET')).status;
      } catch{
        return 0;
      }
    }).toBe(200);
    const compressed = gzipSync(Buffer.from('{ "original":true }'));
    const reply = await wire(httpPort, '/api/items/One%20Two?x=1&x=2', compressed,
      ['Content-Encoding', 'gzip', 'Content-Type', 'application/json', 'Content-Type', 'text/plain',
        'Cookie', 'a=private-one', 'Cookie', 'b=private-two']);
    expect(reply.status).toBe(200);
    expect(JSON.parse(reply.body.toString())).toMatchObject({event: {body: compressed.toString('base64'),
      cookies: ['a=private-one', 'b=private-two'], headers: {'content-encoding': 'gzip',
        'content-type': 'application/json,text/plain'}, rawPath: '/api/items/One%20Two', rawQueryString: 'x=1&x=2'}, version: '17'});
    const binary = await wire(httpPort, '/api/binary', undefined, undefined, 'GET');
    expect(binary.status).toBe(206);
    expect(binary.body).toEqual(Buffer.from([0, 255, 1, 128]));
    expect(binary.headers['set-cookie']).toEqual(['__Host-one=opaque; HttpOnly; Secure', '__Host-two=other; Secure']);
    expect(JSON.parse((await wire(httpPort, '/api/queued')).body.toString())).toEqual({command: 'original-command', version: '23'});
    const scenario = '/api/universes/one/books/two/scenarios';
    const specific = await wire(httpPort, `/local${scenario}/checkpoint-plan?x=1&x=2`, undefined, undefined, 'GET');
    expect(JSON.parse(specific.body.toString())).toMatchObject({event: {rawPath: `/local${scenario}/checkpoint-plan`,
      rawQueryString: 'x=1&x=2'}, version: '19'});
    const generic = await wire(httpPort, `${scenario}/other`, undefined, undefined, 'GET');
    expect(JSON.parse(generic.body.toString())).toMatchObject({event: {rawPath: `${scenario}/other`}, version: '17'});
    expect(logs).not.toContain('private-one');
    expect(logs).not.toContain('UNEXPECTED_OUTBOUND');
  } finally {
    await test.info().attach('local-cli-output', {body: logs, contentType: 'text/plain'});
    child.kill('SIGTERM');
    await new Promise<void>((resolveExit) => (child.exitCode === null ? child.once('exit', () => resolveExit()) : resolveExit()));
    await rm(directory, {force: true, recursive: true});
  }
});
