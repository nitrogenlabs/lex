import {log} from '../utils';

const packageConfig = require('../../package.json');

export const parseVersion = (packageVersion: string = ''): string => packageVersion.replace(/\^/g, '');
export const packages = {
  babel: parseVersion(packageConfig.dependencies['@babel/core']),
  jest: parseVersion(packageConfig.dependencies.jest),
  lex: packageConfig.version,
  typescript: parseVersion(packageConfig.dependencies.typescript),
  webpack: parseVersion(packageConfig.dependencies.webpack)
};
export const jsonVersions = () => JSON.stringify(Object.keys(packages).reduce((list, key) => {
  list[key] = packages[key];
  return list;
}, {}));
export const versions = (cmd) => {
  if(cmd.json) {
    console.log(JSON.stringify(Object.keys(packages).reduce((list, key) => {
      list[key] = packages[key];
      return list;
    }, {})));
  } else {
    log('Versions:', 'info', false);
    log(`  Lex: ${packages.lex}`, 'info', false);
    log('  ----------', 'note', false);
    log(`  Babel: ${packages.babel}`, 'info', false);
    log(`  Jest: ${packages.jest}`, 'info', false);
    log(`  Typescript: ${packages.typescript}`, 'info', false);
    log(`  Webpack: ${packages.webpack}`, 'info', false);
  }
};
