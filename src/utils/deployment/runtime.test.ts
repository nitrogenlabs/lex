import {mkdtempSync,mkdirSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach,describe,expect,it} from 'vitest';

import {createRuntimeLock} from './runtime.js';

const dirs:string[] = [];

afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir,{force:true,recursive:true})));

const fixture = () => {
  const root = mkdtempSync(join(tmpdir(),'lex-runtime-'));
  dirs.push(root);
  for(const path of ['','node_modules/provider','node_modules/provider/node_modules/graphql','node_modules/graphql','node_modules/engine','node_modules/leaf']) {
    mkdirSync(join(root,path),{recursive:true});
    writeFileSync(join(root,path,'package.json'),JSON.stringify({name:path.split('/').at(-1) || 'fixture',version:path === 'node_modules/graphql' ? '17.0.0' : '1.0.0'}));
  }
  const entry = (version:string,dependencies = {}) => ({dependencies,integrity:'sha512-fixture',resolved:'https://registry.npmjs.org/fixture.tgz',version});
  const packages = {
    '':{dependencies:{provider:'1.0.0'},name:'original'},
    'node_modules/engine':entry('1.0.0',{leaf:'^1.0.0'}),
    'node_modules/graphql':entry('17.0.0'),
    'node_modules/leaf':entry('1.0.0'),
    'node_modules/provider':entry('1.0.0'),
    'node_modules/provider/node_modules/graphql':entry('1.0.0')
  };
  writeFileSync(join(root,'package-lock.json'),JSON.stringify({lockfileVersion:3,packages}));
  return {packages,root};
};

describe('exact locked runtime staging', () => {
  it('preserves hoisted peers and one physical placement for a shared dependency', () => {
    const {root,packages} = fixture();
    const graph = packages as Record<string,any>;
    graph['node_modules/provider'].dependencies = {engine:'1',leaf:'1'};
    graph['node_modules/engine'].peerDependencies = {graphql:'17'};
    writeFileSync(join(root,'package-lock.json'),JSON.stringify({lockfileVersion:3,packages:graph}));
    const result = createRuntimeLock({context:join(root,'package.json'),dependencies:['provider'],lockfile:join(root,'package-lock.json')});

    expect(Object.keys(result.lock.packages).sort()).toEqual(['','node_modules/engine','node_modules/graphql','node_modules/leaf','node_modules/provider']);
    expect(result.lock.packages['node_modules/graphql'].version).toBe('17.0.0');
    expect(result.lock.packages['node_modules/leaf'].integrity).toBe('sha512-fixture');
  });

  it('rejects a nested context projection that would shadow a different locked dependency', () => {
    const {root,packages} = fixture();
    const graph = packages as Record<string,any>;
    graph['node_modules/engine'].dependencies = {graphql:'17'};
    writeFileSync(join(root,'package-lock.json'),JSON.stringify({lockfileVersion:3,packages:graph}));

    expect(() => createRuntimeLock({context:join(root,'node_modules/provider/package.json'),dependencies:['engine','graphql'],lockfile:join(root,'package-lock.json')})).toThrow();
  });

  it('rejects an orphaned peer neighborhood when relocating a nested direct package', () => {
    const {root,packages} = fixture();
    const graph = packages as Record<string,any>;
    graph['node_modules/provider/node_modules/graphql'].peerDependencies = {leaf:'2'};
    graph['node_modules/provider/node_modules/leaf'] = {...graph['node_modules/leaf'],version:'2.0.0'};
    writeFileSync(join(root,'package-lock.json'),JSON.stringify({lockfileVersion:3,packages:graph}));

    expect(() => createRuntimeLock({context:join(root,'node_modules/provider/package.json'),dependencies:['graphql'],lockfile:join(root,'package-lock.json')})).toThrow();
  });

  it('rejects a peer installed only below its consumer instead of in the peer neighborhood', () => {
    const {root,packages} = fixture();
    const graph = packages as Record<string,any>;
    delete graph['node_modules/graphql'];
    graph['node_modules/provider'].dependencies = {graphql:'1'};
    graph['node_modules/provider'].peerDependencies = {graphql:'1'};
    writeFileSync(join(root,'package-lock.json'),JSON.stringify({lockfileVersion:3,packages:graph}));

    expect(() => createRuntimeLock({context:join(root,'package.json'),dependencies:['provider'],lockfile:join(root,'package-lock.json')})).toThrow();
  });

  it('resolves a scoped consumer peer beside or above it, separately from its ordinary dependency', () => {
    const {root,packages} = fixture();
    const graph = packages as Record<string,any>;
    const key = 'node_modules/@scope/plugin';
    mkdirSync(join(root,key),{recursive:true});
    writeFileSync(join(root,key,'package.json'),JSON.stringify({name:'@scope/plugin',version:'1.0.0'}));
    graph[key] = {...graph['node_modules/engine'],dependencies:{graphql:'1'},peerDependencies:{graphql:'17'}};
    graph[`${key}/node_modules/graphql`] = {...graph['node_modules/graphql'],version:'1.0.0'};
    writeFileSync(join(root,'package-lock.json'),JSON.stringify({lockfileVersion:3,packages:graph}));
    const result = createRuntimeLock({context:join(root,'package.json'),dependencies:['@scope/plugin'],lockfile:join(root,'package-lock.json')});

    expect(Object.keys(result.lock.packages).sort()).toEqual(['','node_modules/@scope/plugin','node_modules/@scope/plugin/node_modules/graphql','node_modules/graphql']);
    expect(result.lock.packages['node_modules/graphql'].version).toBe('17.0.0');
    expect(result.lock.packages[`${key}/node_modules/graphql`].version).toBe('1.0.0');
  });

  it('rejects a projection that introduces a previously absent optional edge', () => {
    const {root,packages} = fixture();
    const graph = packages as Record<string,any>;
    delete graph['node_modules/graphql'];
    graph['node_modules/engine'].optionalDependencies = {graphql:'1'};
    writeFileSync(join(root,'package-lock.json'),JSON.stringify({lockfileVersion:3,packages:graph}));

    expect(() => createRuntimeLock({context:join(root,'node_modules/provider/package.json'),dependencies:['engine','graphql'],lockfile:join(root,'package-lock.json')})).toThrow();
  });

  it('preserves a nested direct subtree and its hoisted peer when projection is unambiguous', () => {
    const {root,packages} = fixture();
    const graph = packages as Record<string,any>;
    graph['node_modules/provider/node_modules/graphql'].dependencies = {leaf:'2'};
    graph['node_modules/provider/node_modules/graphql'].peerDependencies = {engine:'1'};
    graph['node_modules/provider/node_modules/graphql/node_modules/leaf'] = {...graph['node_modules/leaf'],version:'2.0.0'};
    writeFileSync(join(root,'package-lock.json'),JSON.stringify({lockfileVersion:3,packages:graph}));
    const result = createRuntimeLock({context:join(root,'node_modules/provider/package.json'),dependencies:['graphql'],lockfile:join(root,'package-lock.json')});

    expect(Object.keys(result.lock.packages).sort()).toEqual(['','node_modules/engine','node_modules/graphql','node_modules/graphql/node_modules/leaf','node_modules/leaf']);
    expect(result.lock.packages['node_modules/graphql'].version).toBe('1.0.0');
    expect(result.lock.packages['node_modules/graphql/node_modules/leaf'].version).toBe('2.0.0');
    expect(result.lock.packages['node_modules/leaf'].version).toBe('1.0.0');
  });

  it.each(['events','child_process','net','tls'])('retains locked registry dependency %s despite its builtin name', (name) => {
    const {root,packages} = fixture();
    const graph = packages as Record<string,any>;
    mkdirSync(join(root,'node_modules',name),{recursive:true});
    writeFileSync(join(root,'node_modules',name,'package.json'),JSON.stringify({exports:{'.':'./index.js'},name,version:'3.0.0'}));
    graph[`node_modules/${name}`] = {dependencies:{leaf:'1'},integrity:'sha512-builtin-name',resolved:`https://registry.npmjs.org/${name}.tgz`,version:'3.0.0'};
    graph['node_modules/engine'].dependencies = {[name]:'3'};
    writeFileSync(join(root,'package-lock.json'),JSON.stringify({lockfileVersion:3,packages:graph}));
    const result = createRuntimeLock({context:join(root,'package.json'),dependencies:['engine',name],lockfile:join(root,'package-lock.json')});

    expect(result.manifest.dependencies[name]).toBe('3.0.0');
    expect(result.lock.packages[`node_modules/${name}`].integrity).toBe('sha512-builtin-name');
    expect(result.lock.packages['node_modules/leaf'].version).toBe('1.0.0');
  });

  it('selects nearest nested builtin-named registry package without requiring package.json exports', () => {
    const {root,packages} = fixture();
    const graph = packages as Record<string,any>;
    for(const [key,version] of [['node_modules/events','3.0.0'],['node_modules/engine/node_modules/events','2.0.0']]) {
      mkdirSync(join(root,key),{recursive:true});
      writeFileSync(join(root,key,'package.json'),JSON.stringify({exports:{'.':'./index.js'},name:'events',version}));
      graph[key] = {integrity:`sha512-${version}`,resolved:'https://registry.npmjs.org/events.tgz',version};
    }
    graph['node_modules/engine'].dependencies = {events:'2'};
    writeFileSync(join(root,'package-lock.json'),JSON.stringify({lockfileVersion:3,packages:graph}));
    const result = createRuntimeLock({context:join(root,'package.json'),dependencies:['engine','events'],lockfile:join(root,'package-lock.json')});

    expect(result.lock.packages['node_modules/events'].version).toBe('3.0.0');
    expect(result.lock.packages['node_modules/engine/node_modules/events'].version).toBe('2.0.0');
    expect(result.lock.packages['node_modules/engine/node_modules/events'].integrity).toBe('sha512-2.0.0');
  });

  it('uses source context for GraphQL and retains exact transitive version/integrity', () => {
    const {root} = fixture();
    const result = createRuntimeLock({context:join(root,'node_modules/provider/package.json'),dependencies:['engine','graphql'],lockfile:join(root,'package-lock.json')});

    expect(result.manifest.dependencies).toEqual({engine:'1.0.0',graphql:'1.0.0'});
    expect(result.lock.packages['node_modules/graphql'].version).toBe('1.0.0');
    expect(result.lock.packages['node_modules/leaf'].version).toBe('1.0.0');
    expect(result.lock.packages['node_modules/leaf'].integrity).toBe('sha512-fixture');
    expect(Object.keys(result.lock.packages).filter((key) => key.endsWith('/graphql'))).toEqual(['node_modules/graphql']);
  });

  it('fails closed for absent direct and transitive locked entries', () => {
    const {root,packages} = fixture();

    expect(() => createRuntimeLock({context:join(root,'package.json'),dependencies:['absent'],lockfile:join(root,'package-lock.json')})).toThrow();

    delete (packages as Record<string,unknown>)['node_modules/leaf'];
    writeFileSync(join(root,'package-lock.json'),JSON.stringify({lockfileVersion:3,packages}));

    expect(() => createRuntimeLock({context:join(root,'package.json'),dependencies:['engine'],lockfile:join(root,'package-lock.json')})).toThrow();
  });

  it('preserves optional graph, skips absent optional peers and terminates dependency cycles', () => {
    const {root,packages} = fixture();
    const graph = packages as Record<string,any>;
    graph['node_modules/engine'].optionalDependencies = {absentOptional:'1'};
    graph['node_modules/engine'].peerDependencies = {absentPeer:'1'};
    graph['node_modules/engine'].peerDependenciesMeta = {absentPeer:{optional:true}};
    graph['node_modules/engine'].dev = true;
    graph['node_modules/leaf'].dependencies = {engine:'1'};
    writeFileSync(join(root,'package-lock.json'),JSON.stringify({lockfileVersion:3,packages:graph}));
    const result = createRuntimeLock({context:join(root,'package.json'),dependencies:['engine','engine'],lockfile:join(root,'package-lock.json')});

    expect(Object.keys(result.lock.packages).sort()).toEqual(['','node_modules/engine','node_modules/leaf']);
    expect(result.lock.packages['node_modules/engine']).not.toHaveProperty('dev');
  });

  it.each(['format','empty','invalidName','integrity','resolved','link','requiredPeer','metadata'])('rejects unsafe or incomplete %s inputs', (kind) => {
    const {root,packages} = fixture();
    const graph = packages as Record<string,any>;
    if(kind === 'integrity') {
      delete graph['node_modules/engine'].integrity;
    }
    if(kind === 'resolved') {
      delete graph['node_modules/engine'].resolved;
    }
    if(kind === 'link') {
      graph['node_modules/engine'].link = true;
    }
    if(kind === 'requiredPeer') {
      graph['node_modules/engine'].peerDependencies = {absentPeer:'1'};
    }
    if(kind === 'metadata') {
      rmSync(join(root,'node_modules/engine/package.json'));
    }
    writeFileSync(join(root,'package-lock.json'),JSON.stringify({lockfileVersion:kind === 'format' ? 2 : 3,packages:graph}));

    let dependencies: string[];
    if(kind === 'empty') {
      dependencies = [];
    } else if(kind === 'invalidName') {
      dependencies = ['../engine'];
    } else {
      dependencies = ['engine'];
    }

    expect(() => createRuntimeLock({context:join(root,'package.json'),dependencies,lockfile:join(root,'package-lock.json')})).toThrow();
  });

  it('rejects unlocked/changed installed direct versions', () => {
    const {root} = fixture();
    writeFileSync(join(root,'node_modules/engine/package.json'),JSON.stringify({version:'2.0.0'}));

    expect(() => createRuntimeLock({context:join(root,'package.json'),dependencies:['engine'],lockfile:join(root,'package-lock.json')})).toThrow();
  });
});
