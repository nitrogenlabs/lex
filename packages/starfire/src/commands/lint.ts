import chalk from 'chalk';
import {spawnSync, SpawnSyncReturns} from 'child_process';
import * as path from 'path';

import {StarfireConfig} from '../StarfireConfig';

export const lint = (cmd) => {
  console.log(chalk.cyan('Starfire lint...'));

  // Get custom configuration
  StarfireConfig.parseConfig(cmd);
  const {sourceDir} = StarfireConfig.config;

  // Configure ESLint
  let eslintConfig: string = path.resolve(__dirname, '../../configs/eslint.flow.json');
  let eslintExt: string = '.js,.jsx';

  if(cmd.config) {
    eslintConfig = cmd.config;
  } else if(cmd.typescript) {
    eslintConfig = path.resolve(__dirname, '../../configs/eslint.typescript.json');
    eslintExt = '.js,.jsx,.ts,.tsx';
  }

  const eslintPath: string = path.resolve(__dirname, '../../node_modules/eslint/bin/eslint.js');
  const eslintOptions: string[] = [
    sourceDir,
    '--no-eslintrc',
    '--config',
    eslintConfig,
    '--ext',
    eslintExt
  ];

  if(cmd.fix) {
    eslintOptions.push('--fix');
  }

  console.log('eslintPath', eslintPath);
  console.log('eslintOptions', eslintOptions);
  const eslint: SpawnSyncReturns<Buffer> = spawnSync(eslintPath, eslintOptions, {
    encoding: 'utf-8',
    stdio: 'inherit'
  });

  process.exit(eslint.status);
};
