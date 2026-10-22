import {existsSync,readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,join,relative,resolve} from 'node:path';

interface RuntimeLockEntry {
  [key:string]:unknown;
  dependencies?:Record<string,string>;
  dev?:boolean;
  devOptional?:boolean;
  integrity?:string;
  link?:boolean;
  optionalDependencies?:Record<string,string>;
  peerDependencies?:Record<string,string>;
  peerDependenciesMeta?:Record<string,{optional?:boolean}>;
  resolved?:string;
  version?:string;
}
export interface RuntimeLockOptions {
  context:string;
  dependencies:readonly string[];
  lockfile:string;
}
export interface RuntimeLockResult {
  lock:{lockfileVersion:3;name:string;packages:Record<string,RuntimeLockEntry>;requires:true;version:string};
  manifest:{dependencies:Record<string,string>;name:string;private:true;type:'commonjs';version:string};
}
export const createRuntimeLock = (options:RuntimeLockOptions):RuntimeLockResult => {
  const lockfile = resolve(options.lockfile);
  const root = dirname(lockfile);
  const original = JSON.parse(readFileSync(lockfile,'utf8')) as {
    lockfileVersion?:number;
    packages?:Record<string,RuntimeLockEntry>;
  };
  if(original.lockfileVersion !== 3 || !original.packages || options.dependencies.length === 0) {
    throw new Error('Runtime requires a version3 package lock and dependencies');
  }
  const source = original.packages;
  const packages:Record<string,RuntimeLockEntry> = {};
  const dependencies:Record<string,string> = {};
  const direct = new Map<string,string>();
  const visited = new Set<string>();
  const edges:{key:string;name:string;peer:boolean;resolved:string|undefined}[] = [];
  const find = (context:string,name:string,graph = source):string|undefined => {
    const require = createRequire(resolve(context));
    return require.resolve.paths(`${name}/package.json`)
      ?.map((path) => relative(root,join(path,name)))
      .find((key) => Boolean(graph[key]));
  };
  const edgeContext = (key:string,peer:boolean):string => join(root,peer ? dirname(key) : key,'package.json');
  const add = (key:string):void => {
    if(visited.has(key)) {
      return;
    }
    const entry = source[key];
    if(!/^node_modules\/(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+(?:\/node_modules\/(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+)*$/.test(key) ||
      key.split('/').some((part) => part === '.' || part === '..') ||
      !entry?.version || !entry.integrity || !entry.resolved || entry.link) {
      throw new Error('Runtime dependency lacks an exact supported locked artifact');
    }
    visited.add(key);
    const required = entry.dependencies || {};
    const optional = entry.optionalDependencies || {};
    const peers = entry.peerDependencies || {};
    for(const peer of [false,true]) {
      for(const name of Object.keys(peer ? peers : {...required,...optional}).sort()) {
        const resolved = find(edgeContext(key,peer),name);
        edges.push({key,name,peer,resolved});
        if(!resolved) {
          if(peer ? entry.peerDependenciesMeta?.[name]?.optional : name in optional) {
            continue;
          }
          throw new Error('Missing locked runtime transitive dependency');
        }
        add(resolved);
      }
    }
  };
  for(const name of [...new Set(options.dependencies)].sort()) {
    if(!/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/.test(name)) {
      throw new Error('Invalid runtime dependency name');
    }
    const key = find(options.context,name);
    if(!key) {
      throw new Error('Missing locked runtime direct dependency');
    }
    const metadata = join(root,key,'package.json');
    if(!existsSync(metadata) || JSON.parse(readFileSync(metadata,'utf8')).version !== source[key].version) {
      throw new Error('Installed runtime dependency does not match lock');
    }
    dependencies[name] = source[key].version!;
    direct.set(key,`node_modules/${name}`);
  }
  const roots = [...direct.keys()].sort((left,right) => right.length - left.length);
  const project = (key:string):string => {
    const parent = roots.find((candidate) => key === candidate || key.startsWith(`${candidate}/node_modules/`));
    return parent ? `${direct.get(parent)}${key.slice(parent.length)}` : key;
  };
  for(const key of roots) {
    add(key);
  }
  for(const key of visited) {
    const destination = project(key);
    if(packages[destination]) {
      throw new Error('Runtime context projection collides with a locked placement');
    }
    const {dev:_dev,devOptional:_devOptional,...runtime} = source[key];
    packages[destination] = {...runtime};
  }
  for(const key of Object.keys(packages)) {
    const boundary = key.lastIndexOf('/node_modules/');
    if(boundary !== -1 && !packages[key.slice(0,boundary)]) {
      throw new Error('Runtime context projection lacks a locked ancestor');
    }
  }
  for(const {key,name,peer,resolved} of edges) {
    if(find(edgeContext(project(key),peer),name,packages) !== (resolved ? project(resolved) : undefined)) {
      throw new Error('Runtime context projection changes a locked dependency resolution');
    }
  }
  const manifest = {dependencies,name:'lex-lambda-runtime',private:true,type:'commonjs',version:'1.0.0'} as const;
  packages[''] = {dependencies,name:manifest.name,version:manifest.version};
  return {lock:{lockfileVersion:3,name:manifest.name,packages,requires:true,version:manifest.version},manifest};
};
