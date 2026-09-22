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
  lex: packageJson.version,
  swc: parseVersion(packageJson?.dependencies?.['@swc/core']),
  typescript: parseVersion(packageJson?.dependencies?.typescript),
  vite: parseVersion(packageJson?.dependencies?.vite),
  vitest: parseVersion(packageJson?.dependencies?.vitest)
};

export const jsonVersions = (lexPackages: Record<string, string>): Record<string, string> => {
  const initial: Record<string, string> = {};

  return Object.keys(lexPackages).reduce((list, key) => {
    list[key] = lexPackages[key] || 'N/A';
    return list;
  }, initial);
};

export interface VersionsCmd {
  readonly json?: boolean;
}

export const versions = (cmd: VersionsCmd, callback: (status: number) => void): Promise<number> => {
  if(cmd.json) {
    // eslint-disable-next-line no-console -- Emit raw JSON without the logger's color formatting.
    console.log(JSON.stringify(jsonVersions(packages)));
  } else {
    log('Versions:', 'info', false);
    log(`  Lex: ${packages.lex}`, 'info', false);
    log('  ----------', 'note', false);
    log(`  SWC: ${packages.swc}`, 'info', false);
    log(`  Vitest: ${packages.vitest}`, 'info', false);
    log(`  Typescript: ${packages.typescript}`, 'info', false);
    log(`  Vite: ${packages.vite}`, 'info', false);
  }

  if(callback) {
    callback(0);
  }

  return Promise.resolve(0);
};
