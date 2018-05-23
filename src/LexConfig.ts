import chalk from 'chalk';
import * as find from 'find-file-up';
import * as fs from 'fs';
import * as path from 'path';

import {log} from './utils';

const cwd: string = process.cwd();

export interface LexConfigType {
  entryHTML?: string;
  entryJS?: string;
  env: object;
  outputDir?: string;
  sourceDir?: string;
  useTypescript: boolean;
}

export class LexConfig {
  static config: LexConfigType = {
    entryHTML: 'index.html',
    entryJS: 'app.js',
    env: null,
    outputDir: path.resolve(cwd, './dist'),
    sourceDir: path.resolve(cwd, './src'),
    useTypescript: false
  };

  static updateConfig(updatedConfig: LexConfigType): LexConfigType {
    const {useTypescript} = updatedConfig;

    if(useTypescript !== undefined) {
      LexConfig.useTypescript = useTypescript;
    }

    return {...LexConfig.config, ...updatedConfig};
  }

  static set useTypescript(value: boolean) {
    LexConfig.config.useTypescript = value;

    // Make sure we change the default entry file if Typescript is being used.
    const {entryJS} = LexConfig.config;

    if(entryJS === 'app.js' && value) {
      LexConfig.config.entryJS = 'app.tsx';
    }
  }

  // Get configuration
  static parseConfig(cmd, isRoot: boolean = true) {
    const defaultConfigPath: string = isRoot ?
      path.resolve(cwd, './lex.config.js') :
      find.sync('lex.config.js', cwd, 5);
    const configPath: string = cmd.lexConfig || defaultConfigPath;

    // If user has a Lex config file, lets use it.
    if(fs.existsSync(configPath)) {
      log(chalk.gray('Lex Config:', configPath), cmd);
      const ext: string = path.extname(configPath);

      if(ext === '.json') {
        const configContent: string = fs.readFileSync(configPath, 'utf8');

        if(configContent) {
          const configJson: LexConfigType = JSON.parse(configContent);

          // Determine if we're using Typescript or Flow
          if(cmd.typescript !== undefined) {
            configJson.useTypescript = cmd.typescript;
          }

          process.env.LEX_CONFIG = JSON.stringify(LexConfig.updateConfig(configJson), null, 0);
        } else {
          log(chalk.red(`Config file malformed, ${configPath}`), cmd);
        }
      } else if(ext === '.js') {
        const lexCustomConfig = require(configPath);
        process.env.LEX_CONFIG = JSON.stringify(LexConfig.updateConfig(lexCustomConfig), null, 0);
      } else {
        log(chalk.red('Config file must be a JS or JSON file.'), cmd);
      }
    } else {
      // Determine if we're using Typescript or Flow
      LexConfig.useTypescript = !!cmd.typescript;

      // Save config as environment variable for other commands to include
      process.env.LEX_CONFIG = JSON.stringify(LexConfig.config, null, 0);
    }
  }

  static checkTypescriptConfig() {
    // Make sure tsconfig.json exists
    const tsconfigPath: string = path.resolve(cwd, './tsconfig.json');

    if(!fs.existsSync(tsconfigPath)) {
      fs.writeFileSync(tsconfigPath, fs.readFileSync(path.resolve(__dirname, '../tsconfig.json')));
    }
  }
}
