/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {log} from '../utils/log';

const packageConfig = require('../../package.json');

export const parseVersion = (packageVersion: string = ''): string => packageVersion.replace(/\^/g, '');
export const packages = {
  esbuild: parseVersion(packageConfig.dependencies.esbuild),
  jest: parseVersion(packageConfig.dependencies.jest),
  lex: packageConfig.version,
  typescript: parseVersion(packageConfig.dependencies.typescript),
  webpack: parseVersion(packageConfig.dependencies.webpack)
};
export const jsonVersions = () => Object.keys(packages).reduce((list, key) => {
  list[key] = packages[key];
  return list;
}, {});
export const versions = (cmd: any, callback: any = () => (0)): Promise<number> => {
  if(cmd.json) {
    console.log(JSON.stringify(Object.keys(packages).reduce((list, key) => {
      list[key] = packages[key];
      return list;
    }, {})));
  } else {
    log('Versions:', 'info', false);
    log(`  Lex: ${packages.lex}`, 'info', false);
    log('  ----------', 'note', false);
    log(`  ESBuild: ${packages.esbuild}`, 'info', false);
    log(`  Jest: ${packages.jest}`, 'info', false);
    log(`  Typescript: ${packages.typescript}`, 'info', false);
    log(`  Webpack: ${packages.webpack}`, 'info', false);
  }

  callback(0);
  return Promise.resolve(0);
};
