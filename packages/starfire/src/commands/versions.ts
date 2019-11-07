import chalk from 'chalk';

const packageConfig = require('../../package.json');

const parseVersion = (packageVersion: string = ''): string => packageVersion.replace(/\^/g, '');

export const versions = () => {
  const packages = {
    eslint: parseVersion(packageConfig.dependencies.eslint),
    starfire: packageConfig.version,
    typescript: parseVersion(packageConfig.dependencies.typescript)
  };

  console.log(chalk.bgCyan('Versions:'));
  console.log(chalk.cyan(`  Starfire: ${packages.starfire}`));
  console.log(chalk.grey('  ----------'));
  console.log(chalk.cyan(`  ESLint: ${packages.eslint}`));
  console.log(chalk.cyan(`  Typescript: ${packages.typescript}`));
};
