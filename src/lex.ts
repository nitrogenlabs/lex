#!/usr/bin/env node

import * as program from 'commander';
import {spawnSync} from 'child_process';
import * as fs from 'fs';
import {LexConfig, LexConfigType} from './LexConfig';
import chalk from 'chalk';
import * as path from 'path';

const packageConfig = require('../package.json');

program.version(packageConfig.version)
  .option('-c, --compile', 'Compile and pack')
  .option('-t, --test', 'Test and lint')
  .option('-o, --config [path]', 'Configuration file', '')
  .parse(process.argv);


const cwd: string = './node_modules/@nlabs/lex';
const configPath: string = program.config || './lex.config.js';
const testAndCompile: boolean = !program.compile && !program.test;

// Get configuration
if(fs.existsSync(configPath)) {
  console.log(chalk.gray('Lex Config:', configPath));
  const ext: string = path.extname(configPath);

  if(ext === '.json') {
    const configContent: string = fs.readFileSync(configPath, 'utf8');

    if(configContent) {
      const configJson: LexConfigType = JSON.parse(configContent);
      process.env.LEX_CONFIG = JSON.stringify(LexConfig.updateConfig(configJson), null, 0);
    } else {
      console.error(`Config file malformed, ${configPath}`);
    }
  } else if(ext === '.js') {
    const lexCustomConfig = require(`${process.cwd()}/${configPath}`);
    process.env.LEX_CONFIG = JSON.stringify(LexConfig.updateConfig(lexCustomConfig), null, 0);
  } else {
    console.error('Config file must be a JS or JSON file.');
  }
} else {
  process.env.LEX_CONFIG = JSON.stringify(LexConfig.config, null, 0);
}

if(testAndCompile || program.test) {
  console.log(chalk.blue('Lex Testing...'));
  const jestPath = `${cwd}/node_modules/jest/bin/jest.js`;
  const {jestSetupFile = ''} = LexConfig.config;
  const jestOptions: string[] = ['--config', `${cwd}/jest.config.js`];

  if(jestSetupFile !== '') {
    jestOptions.push('--setupTestFrameworkScriptFile', jestSetupFile);
  }

  spawnSync(jestPath, jestOptions, {
    stdio: 'inherit',
    encoding: 'utf-8'
  });
}

if(testAndCompile || program.compile) {
  console.log(chalk.blue('Lex Compiling...'));
  const webpackDevPath = `${cwd}/node_modules/webpack-dev-server/bin/webpack-dev-server.js`;
  spawnSync(webpackDevPath, ['--config', `${cwd}/webpack.config.ts`, '--open'], {
    stdio: 'inherit',
    encoding: 'utf-8'
  });
}
