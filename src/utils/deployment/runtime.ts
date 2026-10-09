import {existsSync,readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,join,relative,resolve} from 'node:path';

interface RuntimeLockEntry {
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
  [key:string]:unknown;
}
export interface RuntimeLockOptions {context:string;dependencies:readonly string[];lockfile:string;}
export interface RuntimeLockResult {
  lock:{lockfileVersion:3;name:string;packages:Record<string,RuntimeLockEntry>;requires:true;version:string};
  manifest:{dependencies:Record<string,string>;name:string;private:true;type:'commonjs';version:string};
}
export const createRuntimeLock = (options:RuntimeLockOptions):RuntimeLockResult => {
  const lockfile=resolve(options.lockfile);const root=dirname(lockfile);
  const original=JSON.parse(readFileSync(lockfile,'utf8')) as {lockfileVersion?:number;packages?:Record<string,RuntimeLockEntry>};
  if(original.lockfileVersion!==3 || !original.packages || options.dependencies.length===0)throw new Error('Runtime requires a version3 package lock and dependencies');
  const source=original.packages;const packages:Record<string,RuntimeLockEntry>={};const dependencies:Record<string,string>={};
  const find = (context:string,name:string):string|undefined => {
    const require=createRequire(resolve(context));
    return require.resolve.paths(name)?.map((path) => relative(root,join(path,name))).find((key) => Boolean(source[key]));
  };
  const add = (key:string,destination:string,ancestors:ReadonlyMap<string,string>):void => {
    if(ancestors.has(key))return;
    const entry=source[key];
    if(!entry?.version || !entry.integrity || !entry.resolved || entry.link)throw new Error('Runtime dependency lacks an exact supported locked artifact');
    const {dev:_dev,devOptional:_devOptional,...runtime}=entry;packages[destination]={...runtime};
    const next=new Map(ancestors);next.set(key,destination);
    const required=entry.dependencies || {};const optional=entry.optionalDependencies || {};const peers=entry.peerDependencies || {};
    for(const name of Object.keys({...required,...optional,...peers}).sort()) {
      const resolved=find(join(root,key,'package.json'),name);
      if(!resolved) {if(name in optional || entry.peerDependenciesMeta?.[name]?.optional)continue;throw new Error('Missing locked runtime transitive dependency');}
      add(resolved,`${destination}/node_modules/${name}`,next);
    }
  };
  for(const name of [...new Set(options.dependencies)].sort()) {
    if(!/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/.test(name))throw new Error('Invalid runtime dependency name');
    const key=find(options.context,name);if(!key)throw new Error('Missing locked runtime direct dependency');
    const metadata=join(root,key,'package.json');
    if(!existsSync(metadata) || JSON.parse(readFileSync(metadata,'utf8')).version!==source[key].version)throw new Error('Installed runtime dependency does not match lock');
    dependencies[name]=source[key].version!;add(key,`node_modules/${name}`,new Map());
  }
  const manifest={dependencies,name:'lex-lambda-runtime',private:true,type:'commonjs',version:'1.0.0'} as const;
  packages['']={dependencies,name:manifest.name,version:manifest.version};
  return {lock:{lockfileVersion:3,name:manifest.name,packages,requires:true,version:manifest.version},manifest};
};
