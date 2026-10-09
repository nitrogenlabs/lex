import {mkdtempSync,mkdirSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach,describe,expect,it} from 'vitest';
import {createRuntimeLock} from './runtime.js';
const dirs:string[]=[];afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir,{force:true,recursive:true})));
const fixture=() => {
 const root=mkdtempSync(join(tmpdir(),'lex-runtime-'));dirs.push(root);
 for(const path of ['','node_modules/provider','node_modules/provider/node_modules/graphql','node_modules/graphql','node_modules/engine','node_modules/leaf']) {mkdirSync(join(root,path),{recursive:true});writeFileSync(join(root,path,'package.json'),JSON.stringify({name:path.split('/').at(-1)||'fixture',version:path==='node_modules/graphql' ? '17.0.0' : '1.0.0'}));}
 const entry=(version:string,dependencies={}) => ({dependencies,integrity:'sha512-fixture',resolved:'https://registry.npmjs.org/fixture.tgz',version});
 const packages={'':{name:'original',dependencies:{provider:'1.0.0'}},'node_modules/provider':entry('1.0.0'), 'node_modules/provider/node_modules/graphql':entry('1.0.0'),'node_modules/graphql':entry('17.0.0'),'node_modules/engine':entry('1.0.0',{leaf:'^1.0.0'}),'node_modules/leaf':entry('1.0.0')};
 writeFileSync(join(root,'package-lock.json'),JSON.stringify({lockfileVersion:3,packages}));return {root,packages};
};
describe('exact locked runtime staging', () => {
 it('uses source context for GraphQL and retains exact transitive version/integrity', () => {
 const {root}=fixture();const result=createRuntimeLock({context:join(root,'node_modules/provider/package.json'),dependencies:['engine','graphql'],lockfile:join(root,'package-lock.json')});
 expect(result.manifest.dependencies).toEqual({engine:'1.0.0',graphql:'1.0.0'});
 expect(result.lock.packages['node_modules/graphql'].version).toBe('1.0.0');expect(result.lock.packages['node_modules/engine/node_modules/leaf'].version).toBe('1.0.0');
 expect(result.lock.packages['node_modules/engine/node_modules/leaf'].integrity).toBe('sha512-fixture');expect(Object.keys(result.lock.packages).filter((key) => key.endsWith('/graphql'))).toEqual(['node_modules/graphql']);
 });
 it('fails closed for absent direct and transitive locked entries', () => {
 const {root,packages}=fixture();expect(() => createRuntimeLock({context:join(root,'package.json'),dependencies:['absent'],lockfile:join(root,'package-lock.json')})).toThrow();
 delete (packages as Record<string,unknown>)['node_modules/leaf'];writeFileSync(join(root,'package-lock.json'),JSON.stringify({lockfileVersion:3,packages}));expect(() => createRuntimeLock({context:join(root,'package.json'),dependencies:['engine'],lockfile:join(root,'package-lock.json')})).toThrow();
 });
 it('preserves optional graph, skips absent optional peers and terminates dependency cycles', () => {
 const {root,packages}=fixture();const graph=packages as Record<string,any>;
 graph['node_modules/engine'].optionalDependencies={absentOptional:'1'};graph['node_modules/engine'].peerDependencies={absentPeer:'1'};graph['node_modules/engine'].peerDependenciesMeta={absentPeer:{optional:true}};graph['node_modules/engine'].dev=true;
 graph['node_modules/leaf'].dependencies={engine:'1'};writeFileSync(join(root,'package-lock.json'),JSON.stringify({lockfileVersion:3,packages:graph}));
 const result=createRuntimeLock({context:join(root,'package.json'),dependencies:['engine','engine'],lockfile:join(root,'package-lock.json')});
 expect(Object.keys(result.lock.packages).sort()).toEqual(['','node_modules/engine','node_modules/engine/node_modules/leaf']);expect(result.lock.packages['node_modules/engine']).not.toHaveProperty('dev');
 });
 it.each(['format','empty','invalidName','integrity','resolved','link','requiredPeer','metadata'])('rejects unsafe or incomplete %s inputs', (kind) => {
 const {root,packages}=fixture();const graph=packages as Record<string,any>;
 if(kind==='integrity')delete graph['node_modules/engine'].integrity;
 if(kind==='resolved')delete graph['node_modules/engine'].resolved;
 if(kind==='link')graph['node_modules/engine'].link=true;
 if(kind==='requiredPeer')graph['node_modules/engine'].peerDependencies={absentPeer:'1'};
 if(kind==='metadata')rmSync(join(root,'node_modules/engine/package.json'));
 writeFileSync(join(root,'package-lock.json'),JSON.stringify({lockfileVersion:kind==='format' ? 2 : 3,packages:graph}));
 expect(() => createRuntimeLock({context:join(root,'package.json'),dependencies:kind==='empty' ? [] : kind==='invalidName' ? ['../engine'] : ['engine'],lockfile:join(root,'package-lock.json')})).toThrow();
 });
 it('rejects unlocked/changed installed direct versions', () => {
 const {root}=fixture();writeFileSync(join(root,'node_modules/engine/package.json'),JSON.stringify({version:'2.0.0'}));expect(() => createRuntimeLock({context:join(root,'package.json'),dependencies:['engine'],lockfile:join(root,'package-lock.json')})).toThrow();
 });
});
