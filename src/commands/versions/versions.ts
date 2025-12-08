/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {readFileSync} from 'fs';

import {getLexPackageJsonPath} from '../../utils/file.js';
import {log} from '../../utils/log.js';

const packagePath = getLexPackageJsonPath();
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

export const parseVersion = (packageVersion: string): string => packageVersion?.replace(/\^/g, '') || 'N/A';

export const packages = {
  jest: parseVersion(packageJson?.dependencies?.jest),
  lex: packageJson.version,
  swc: parseVersion(packageJson?.dependencies?.['@swc/core']),
  typescript: parseVersion(packageJson?.dependencies?.typescript),
  webpack: parseVersion(packageJson?.dependencies?.webpack)
};

export const jsonVersions = (lexPackages) => Object.keys(lexPackages).reduce((list, key) => {
  list[key] = packages[key];
  return list;
}, {});

export interface VersionsCmd {
  readonly json?: boolean;
}

export const versions = (cmd: VersionsCmd, callback: (status: number)=> void): Promise<number> => {
  if(cmd.json) {
    console.log(JSON.stringify(jsonVersions(packages)));
  } else {
    log('Versions:', 'info', false);
    log(`  Lex: ${packages.lex}`, 'info', false);
    log('  ----------', 'note', false);
    log(`  SWC: ${packages.swc}`, 'info', false);
    log(`  Jest: ${packages.jest}`, 'info', false);
    log(`  Typescript: ${packages.typescript}`, 'info', false);
    log(`  Webpack: ${packages.webpack}`, 'info', false);
  }

  if(callback) {
    callback(0);
  }

  return Promise.resolve(0);
};