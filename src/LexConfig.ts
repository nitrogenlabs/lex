import chalk from 'chalk';
import * as find from 'find-file-up';
import * as fs from 'fs';
import * as path from 'path';

import {log} from './utils';

const cwd: string = process.cwd();

export interface LexConfigType {
  entryHTML?: string;
  entryJS?: string;
  env?: object;
  outputFullPath?: string;
  outputPath?: string;
  packageManager?: string;
  sourceFullPath?: string;
  sourcePath?: string;
  targetEnvironment?: 'node' | 'web';
  useTypescript?: boolean;
}

export class LexConfig {
  static config: LexConfigType = {
    entryHTML: 'index.html',
    entryJS: 'app.js',
    env: null,
    outputFullPath: path.resolve(cwd, './dist'),
    outputPath: './dist',
    packageManager: 'yarn',
    sourceFullPath: path.resolve(cwd, './src'),
    sourcePath: './src',
    targetEnvironment: 'node',
    useTypescript: false
  };

  // Set options from a custom configuration file
  static updateConfig(updatedConfig: LexConfigType): LexConfigType {
    const {outputFullPath, outputPath, sourcePath, sourceFullPath, useTypescript} = updatedConfig;
    const cwd: string = process.cwd();

    // Use Typescript
    if(useTypescript !== undefined) {
      LexConfig.useTypescript = useTypescript;
    }

    // Destination Path
    if(outputPath !== undefined && outputFullPath === undefined) {
      updatedConfig.outputFullPath = path.resolve(cwd, outputPath);
    }

    // Source code path
    if(sourcePath !== undefined && sourceFullPath === undefined) {
      updatedConfig.sourceFullPath = path.resolve(cwd, sourcePath);
    }

    LexConfig.config = {...LexConfig.config, ...updatedConfig};
    return LexConfig.config;
  }

  static set useTypescript(value: boolean) {
    LexConfig.config.useTypescript = value;

    // Make sure we change the default entry file if Typescript is being used.
    const {entryJS} = LexConfig.config;

    if(entryJS === 'app.js' && value) {
      LexConfig.config.entryJS = 'app.tsx';
    }
  }

  // Set option updates from the command line
  static addConfigParams(cmd, params: LexConfigType) {
    // Determine if we're using Typescript or Flow
    if(cmd.typescript !== undefined) {
      params.useTypescript = cmd.typescript;
    }

    // Set the target environment
    if(cmd.environment !== undefined) {
      params.targetEnvironment = cmd.environment === 'web' ? 'web' : 'node';
    }

    process.env.LEX_CONFIG = JSON.stringify(LexConfig.updateConfig(params), null, 0);
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
          let configJson: LexConfigType;

          try {
            configJson = JSON.parse(configContent);
          } catch(error) {
            configJson = {};
          }

          LexConfig.addConfigParams(cmd, configJson);
        } else {
          log(chalk.red(`Config file malformed, ${configPath}`), cmd);
        }
      } else if(ext === '.js') {
        const lexCustomConfig = require(configPath);
        LexConfig.addConfigParams(cmd, lexCustomConfig);
      } else {
        log(chalk.red('Config file must be a JS or JSON file.'), cmd);
      }
    } else {
      // Determine if we're using Typescript or Flow
      LexConfig.useTypescript = !!cmd.typescript;

      // Save config as environment variable for other commands to include
      LexConfig.addConfigParams(cmd, LexConfig.config);
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
