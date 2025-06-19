/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {existsSync, readFileSync, writeFileSync} from 'fs';
import {extname as pathExtname, resolve as pathResolve} from 'path';
import {URL} from 'url';

import {relativeFilePath} from './utils/file.js';
import {log} from './utils/log.js';

const cwd: string = process.cwd();

export interface EsbuildConfig {
  entryPoints?: string[];
  outdir?: string;
  platform?: 'node' | 'browser';
  target?: string;
  format?: 'cjs' | 'esm';
  [key: string]: unknown;
}

export interface JestConfig {
  roots?: string[];
  testEnvironment?: string;
  transform?: Record<string, [string, Record<string, unknown>]>;
  [key: string]: unknown;
}

export interface WebpackConfig {
  entry?: string | string[];
  output?: Record<string, unknown>;
  module?: Record<string, unknown>;
  plugins?: unknown[];
  [key: string]: unknown;
}

export interface AIConfig {
  provider?: 'cursor' | 'copilot' | 'openai' | 'anthropic' | 'none';
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LexConfigType {
  ai?: AIConfig;
  configFiles?: string[];
  entryHTML?: string;
  entryJs?: string;
  esbuild?: EsbuildConfig;
  env?: object;
  gitUrl?: string;
  jest?: JestConfig;
  libraryName?: string;
  libraryTarget?: string;
  outputFile?: string;
  outputFullPath?: string;
  outputHash?: boolean;
  outputPath?: string;
  packageManager?: 'npm' | 'yarn';
  preset?: 'web' | 'node' | 'lambda' | 'mobile';
  sourceFullPath?: string;
  sourcePath?: string;
  targetEnvironment?: 'node' | 'web';
  useGraphQl?: boolean;
  useTypescript?: boolean;
  webpack?: WebpackConfig;
}

export const defaultConfigValues: LexConfigType = {
  ai: {
    provider: 'none',
    model: 'gpt-4o',
    maxTokens: 4000,
    temperature: 0.1
  },
  aiDefaultModel: 'gpt-4o', // Legacy support
  configFiles: [],
  entryHTML: 'index.html',
  entryJs: 'index.js',
  esbuild: {},
  env: null,
  jest: {},
  outputFullPath: pathResolve(cwd, './dist'),
  outputHash: false,
  outputPath: './dist',
  packageManager: 'npm',
  preset: 'web',
  sourceFullPath: pathResolve(cwd, './src'),
  sourcePath: './src',
  targetEnvironment: 'web',
  useGraphQl: false,
  useTypescript: false,
  webpack: {}
};

export class LexConfig {
  static config: LexConfigType = {
    ...defaultConfigValues
  };

  static set useTypescript(value: boolean) {
    LexConfig.config.useTypescript = value;
    const {sourceFullPath} = LexConfig.config;

    // Make sure we change the default entry file if Typescript is being used.
    const {entryJs} = LexConfig.config;

    if(entryJs === 'index.js' && value) {
      const indexPath: string = pathResolve(cwd, sourceFullPath, 'index.tsx');
      const hasIndexTsx: boolean = existsSync(indexPath);

      if(hasIndexTsx) {
        LexConfig.config.entryJs = 'index.tsx';
      } else {
        LexConfig.config.entryJs = 'index.ts';
      }
    }
  }

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
      updatedConfig.outputFullPath = pathResolve(cwd, outputPath);
    }

    // Source code path
    if(sourcePath !== undefined && sourceFullPath === undefined) {
      updatedConfig.sourceFullPath = pathResolve(cwd, sourcePath);
    }

    LexConfig.config = {...LexConfig.config, ...updatedConfig};
    return LexConfig.config;
  }

  // Set option updates from the command line
  static addConfigParams(cmd, params: LexConfigType) {
    const nameProperty: string = '_name';
    const {environment, outputPath, sourcePath, typescript} = cmd;

    // Custom output dir
    if(outputPath !== undefined) {
      params.outputPath = outputPath;
      params.outputFullPath = pathResolve(cwd, outputPath);
    }

    // Custom source dir
    if(sourcePath !== undefined) {
      params.sourcePath = sourcePath;
      params.sourceFullPath = pathResolve(cwd, sourcePath);
    }

    // Determine if we're using Typescript or Flow
    if(typescript !== undefined) {
      params.useTypescript = true;
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
  static async parseConfig(cmd, isRoot: boolean = true): Promise<void> {
    const {cliName = 'Lex', lexConfig, lexConfigName, quiet, typescript} = cmd;
    const configName: string = lexConfigName || 'lex.config.js';
    const defaultConfigPath: string = isRoot
      ? pathResolve(cwd, `./${configName}`)
      : relativeFilePath(configName, cwd);
    const configPath: string = lexConfig || defaultConfigPath;
    const configExists: boolean = existsSync(configPath);

    // If user has a Lex config file, lets use it.
    if(configExists) {
      log(`Using ${cliName} configuration file: ${configPath}`, 'note', quiet);
      const ext: string = pathExtname(configPath);

      if(ext === '.json') {
        const configContent: string = readFileSync(configPath, 'utf8');

        if(configContent) {
          let configJson: LexConfigType;

          try {
            configJson = JSON.parse(configContent)?.default || {};
          } catch(_error) {
            configJson = {};
          }

          LexConfig.addConfigParams(cmd, configJson);
        } else {
          log(`\n${cliName} Error: Config file malformed, ${configPath}`, 'error', quiet);
        }
      } else if(ext === '.js') {
        const lexCustomConfig = await import(configPath);
        LexConfig.addConfigParams(cmd, lexCustomConfig.default || {});
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
    const tsconfigPath: string = pathResolve(cwd, './tsconfig.json');

    if(!existsSync(tsconfigPath)) {
      const dirName = new URL('.', import.meta.url).pathname;
      writeFileSync(tsconfigPath, readFileSync(pathResolve(dirName, '../../../tsconfig.base.json')));
    }
  }
}
