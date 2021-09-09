/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import * as fs from 'fs';
import * as path from 'path';

import {log, relativeFilePath} from './utils';

const cwd: string = process.cwd();

export interface LexConfigType {
  configFiles?: string[];
  entryHTML?: string;
  entryJs?: string;
  esbuild?: any;
  env?: object;
  gitUrl?: string;
  jest?: any;
  libraryName?: string;
  libraryTarget?: string;
  outputFile?: string;
  outputFullPath?: string;
  outputHash?: boolean;
  outputPath?: string;
  packageManager?: 'npm' | 'yarn';
  preset?: 'web' | 'node' | 'lambda';
  sourceFullPath?: string;
  sourcePath?: string;
  targetEnvironment?: 'node' | 'web';
  useTypescript?: boolean;
  webpack?: any;
}

export class LexConfig {
  static config: LexConfigType = {
    configFiles: [],
    entryHTML: 'index.html',
    entryJs: 'index.js',
    esbuild: {},
    env: null,
    jest: {},
    outputFullPath: path.resolve(cwd, './dist'),
    outputHash: false,
    outputPath: './dist',
    packageManager: 'npm',
    preset: 'web',
    sourceFullPath: path.resolve(cwd, './src'),
    sourcePath: './src',
    targetEnvironment: 'web',
    useTypescript: false,
    webpack: {}
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
    const {sourceFullPath} = LexConfig.config;

    // Make sure we change the default entry file if Typescript is being used.
    const {entryJs} = LexConfig.config;

    if(entryJs === 'index.js' && value) {
      const indexPath: string = path.resolve(cwd, sourceFullPath, 'index.tsx');
      const hasIndexTsx: boolean = fs.existsSync(indexPath);

      if(hasIndexTsx) {
        LexConfig.config.entryJs = 'index.tsx';
      } else {
        LexConfig.config.entryJs = 'index.ts';
      }
    }
  }

  // Set option updates from the command line
  static addConfigParams(cmd, params: LexConfigType) {
    const nameProperty: string = '_name';
    const {environment, outputPath, sourcePath, typescript} = cmd;

    // Custom output dir
    if(outputPath !== undefined) {
      params.outputPath = outputPath;
      params.outputFullPath = path.resolve(cwd, outputPath);
    }

    // Custom source dir
    if(sourcePath !== undefined) {
      params.sourcePath = sourcePath;
      params.sourceFullPath = path.resolve(cwd, sourcePath);
    }

    // Determine if we're using Typescript or Flow
    if(typescript !== undefined) {
      params.useTypescript = typescript;
    }

    // Set the target environment
    if(environment !== undefined) {
      params.targetEnvironment = environment === 'web' ? 'web' : 'node';
    }

    process.env.LEX_CONFIG = JSON.stringify(
      {
        ...LexConfig.updateConfig(params),
        commandName: cmd[nameProperty],
        isStatic: cmd.static
      }, null, 0
    );
  }

  // Get configuration
  static parseConfig(cmd, isRoot: boolean = true): void {
    const {cliName = 'Lex', lexConfig, lexConfigName, quiet, typescript} = cmd;
    const configName: string = lexConfigName || 'lex.config.js';
    const defaultConfigPath: string = isRoot
      ? path.resolve(cwd, `./${configName}`)
      : relativeFilePath(configName, cwd);
    const configPath: string = lexConfig || defaultConfigPath;
    const configExists: boolean = fs.existsSync(configPath);

    // If user has a Lex config file, lets use it.
    if(configExists) {
      log(`Using ${cliName} configuration file: ${configPath}`, 'note', quiet);
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
          log(`\n${cliName} Error: Config file malformed, ${configPath}`, 'error', quiet);
        }
      } else if(ext === '.js') {
        const lexCustomConfig = require(configPath);
        LexConfig.addConfigParams(cmd, lexCustomConfig);
      } else {
        log(`\n${cliName} Error: Config file must be a JS or JSON file.`, 'error', quiet);
      }
    } else {
      // Determine if we're using Typescript or Flow
      LexConfig.useTypescript = !!typescript;

      // Save config as environment variable for other commands to include
      LexConfig.addConfigParams(cmd, LexConfig.config);
    }
  }

  static checkTypescriptConfig() {
    // Make sure tsconfig.json exists
    const tsconfigPath: string = path.resolve(cwd, './tsconfig.json');

    if(!fs.existsSync(tsconfigPath)) {
      fs.writeFileSync(tsconfigPath, fs.readFileSync(path.resolve(__dirname, '../../../tsconfig.base.json')));
    }
  }
}
