import execa from 'execa';
import * as path from 'path';

import {StarfireConfig} from '../StarfireConfig';
import {createSpinner} from '../utils';

export const lint = async (cmd) => {
  const {
    quiet
  } = cmd;

  // Spinner
  const spinner = createSpinner(quiet);
  spinner.start('Linting files...');

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
  try {
    await execa(eslintPath, eslintOptions, {
      encoding: 'utf-8',
      stdio: 'inherit'
    });

    spinner.succeed('Linting completed!');
    process.exit(0);
  } catch(error) {
    // Stop spinner
    spinner.fail('Linting failed!');

    process.exit(1);
  }
};
