import {spawnSync} from 'node:child_process';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {afterEach, describe, expect, it} from 'vitest';

const dirs: string[] = [];

afterEach(() => {
  for(const dir of dirs.splice(0)) {
    rmSync(dir, {
      force: true, recursive: true
    });
  }
});

const fixture = (repo: string, source: string) => {
  const dir = mkdtempSync(join(tmpdir(), 'lambda-domain-smoke-'));
  dirs.push(dir);
  writeFileSync(join(dir, 'index.js'), source);
  const path = fileURLToPath(new URL(`../../../../${repo}/deployment/api-package-smoke.mjs`, import.meta.url));
  return spawnSync(process.execPath, [path], {
    cwd: dir, encoding: 'utf8', env: {
      ...process.env, AWS_EC2_METADATA_DISABLED: 'true'
    }
  });
};

describe('retained domain startup checks', () => {
  it('checks all six Phantaze exports and registers custom root fields', () => {
    const result = fixture('phantaze', 'for(const name of [\'handler\',\'authorizer\',\'uploadHandler\',\'defaultHandler\',\'messageHandler\',\'connectionHandler\'])exports[name]=()=>{};exports.registerCustomRootFields=()=>{};');

    expect(result.status).toBe(0);
  });

  it.each(['exports.handler=()=>{};', 'for(const name of [\'handler\',\'authorizer\',\'uploadHandler\',\'defaultHandler\',\'messageHandler\',\'connectionHandler\'])exports[name]=()=>{};exports.registerCustomRootFields=()=>{throw new Error(\'synthetic failure\')};'])('rejects missing exports or schema initialization failure (%s)', (source) => {
    expect(fixture('phantaze', source).status).toBe(1);
  });

  it('calls isolated UrbanX health and GraphQL stage routes in order', () => {
    const source = 'let count=0;exports.handler=async(event)=>{count++;if(count===1){if(event.rawPath!==\'/dev/health\'||event.requestContext.http.method!==\'GET\')throw new Error(\'wrong health\');return {statusCode:200,body:JSON.stringify({data:{ok:true}})}}if(event.rawPath!==\'/dev/public\'||event.requestContext.http.method!==\'POST\'||JSON.parse(event.body).query!==\'{ urbanx { stage } }\')throw new Error(\'wrong GraphQL\');return {body:JSON.stringify({data:{urbanx:{stage:\'dev\'}}})}};';

    expect(fixture('urbanx', source).status).toBe(0);
  });

  it.each(['exports.handler=async()=>({statusCode:500,body:\'{}\'});', 'exports.handler=async(event)=>event.rawPath.endsWith(\'health\')?{statusCode:200,body:JSON.stringify({data:{ok:true}})}:{body:JSON.stringify({errors:[{message:\'failure\'}]})};'])('rejects failed UrbanX health/schema checks (%s)', (source) => {
    expect(fixture('urbanx', source).status).toBe(1);
  });
});
