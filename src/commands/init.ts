import chalk from 'chalk';
import {spawnSync} from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export const init = (appName: string, packageName: string, cmd) => {
  const cwd: string = process.cwd();

  // Download app into temporary directory
  console.log(chalk.cyan('Lex downloading...'));
  packageName = packageName || '@nlabs/arkhamjs-example-react';
  const tmpPath: string = path.resolve(cwd, './.lexTmp');
  const appPath: string = path.resolve(cwd, `./${appName}`);
  const dnpPath: string = path.resolve(__dirname, '../../node_modules/download-npm-package/bin/cli.js');

  spawnSync(dnpPath, [packageName, tmpPath], {
    encoding: 'utf-8',
    stdio: 'inherit'
  });

  console.log(chalk.cyan('Lex initializing...'));

  // Move into configured directory
  fs.renameSync(`${tmpPath}/${packageName}`, appPath);

  // Configure package.json
  const packagePath: string = `${appPath}/package.json`;
  const packageData: string = fs.readFileSync(packagePath).toString();
  const packageJson = JSON.parse(packageData);
  packageJson.name = appName;
  packageJson.description = 'Lex created app';
  packageJson.version = '0.1.0';
  delete packageJson.keywords;
  delete packageJson.author;
  delete packageJson.contributors;
  delete packageJson.repository;
  delete packageJson.homepage;
  delete packageJson.bugs;

  // Update package.json
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

  // Update README
  const readmePath: string = `${appPath}/README.md`;
  fs.writeFileSync(readmePath, `# ${appName}`);

  process.exit(0);
};
