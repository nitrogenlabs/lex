import chalk from 'chalk';

const packageConfig = require('../../package.json');
export const parseVersion = (packageVersion: string = ''): string => {
  return packageVersion.replace(/\^/g, '');
};

export const versions = (cmd) => {
  const packages = {
    babel: parseVersion(packageConfig.dependencies['@babel/core']),
    jest: parseVersion(packageConfig.dependencies.jest),
    lex: packageConfig.version,
    typescript: parseVersion(packageConfig.dependencies.typescript),
    webpack: parseVersion(packageConfig.dependencies.webpack)
  };

  if(cmd.json) {
    console.log(JSON.stringify(Object.keys(packages).reduce((list, key) => {
      list[key] = packages[key];
      return list;
    }, {})));
  } else {
    console.log(chalk.bgCyan('Versions:'));
    console.log(chalk.cyan(`  Lex: ${packages.lex}`));
    console.log(chalk.grey('  ----------'));
    console.log(chalk.cyan(`  Babel: ${packages.babel}`));
    console.log(chalk.cyan(`  Jest: ${packages.jest}`));
    console.log(chalk.cyan(`  Typescript: ${packages.typescript}`));
    console.log(chalk.cyan(`  Webpack: ${packages.webpack}`));
  }
};
