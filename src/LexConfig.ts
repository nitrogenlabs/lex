/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {existsSync, readFileSync, writeFileSync} from 'fs';
import {dirname, extname as pathExtname, resolve as pathResolve} from 'path';
import {URL} from 'url';

import {getDirName, getLexPackageJsonPath, relativeFilePath} from './utils/file.js';
import {log} from './utils/log.js';

const cwd: string = process.cwd();

export interface EsbuildConfig {
  entryPoints?: string[];
  outdir?: string;
  platform?: 'node' | 'browser';
  target?: string;
  format?: 'cjs' | 'esm';
  minify?: boolean;
  treeShaking?: boolean;
  drop?: string[];
  pure?: string[];
  external?: string[];
  splitting?: boolean;
  metafile?: boolean;
  sourcemap?: boolean | 'inline' | 'external';
  legalComments?: 'none' | 'inline' | 'eof' | 'linked' | 'separate';
  banner?: Record<string, string>;
  footer?: Record<string, string>;
  define?: Record<string, string>;
  [key: string]: unknown;
}

export interface JestConfig {
  roots?: string[];
  testEnvironment?: string;
  transform?: Record<string, [string, Record<string, unknown>]>;
  transformIgnorePatterns?: string[];
  moduleNameMapper?: Record<string, string>;
  extensionsToTreatAsEsm?: string[];
  preset?: string;
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
  copyFiles?: string[];
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

export type Config = LexConfigType;

export const defaultConfigValues: LexConfigType = {
  ai: {
    provider: 'none',
    model: 'gpt-4o',
    maxTokens: 4000,
    temperature: 0.1
  },
  configFiles: [],
  copyFiles: [],
  entryHTML: 'index.html',
  entryJs: 'index.js',
  esbuild: {
    minify: true,
    treeShaking: true,
    drop: ['console', 'debugger'],
    pure: ['console.log', 'console.warn', 'console.error'],
    legalComments: 'none',
    splitting: true,
    metafile: false,
    sourcemap: false
  },
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

function findLexRoot(startDir: string): string {
  let dir = startDir;
  console.log('DEBUG: findLexRoot starting with dir:', dir); // TEMP DEBUG
  while(dir !== '/' && dir !== '.') {
    const pkgPath = pathResolve(dir, 'package.json');
    console.log('DEBUG: findLexRoot checking', pkgPath); // TEMP DEBUG
    if(existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
        if(pkg.name === '@nlabs/lex') {
          return dir;
        }
      } catch{}
    }
    const parent = dirname(dir);
    console.log('DEBUG: findLexRoot parent of', dir, 'is', parent); // TEMP DEBUG
    if(parent === dir) {
      break;
    }
    dir = parent;
  }
  throw new Error('Could not find @nlabs/lex root');
}

/**
 * Get the appropriate TypeScript config path, prioritizing project configs over Lex configs
 */
export function getTypeScriptConfigPath(configName: string): string {
  const cwd = process.cwd();

  // For compile command, check for project's build config first
  if(configName === 'tsconfig.build.json') {
    const projectBuildConfig = pathResolve(cwd, 'tsconfig.build.json');
    if(existsSync(projectBuildConfig)) {
      return projectBuildConfig;
    }
  }

  // For lint command, check for project's lint config first
  if(configName === 'tsconfig.lint.json') {
    const projectLintConfig = pathResolve(cwd, 'tsconfig.eslint.json');
    if(existsSync(projectLintConfig)) {
      return projectLintConfig;
    }
  }

  // For test command, check for project's test config first
  if(configName === 'tsconfig.test.json') {
    const projectTestConfig = pathResolve(cwd, 'tsconfig.test.json');
    if(existsSync(projectTestConfig)) {
      return projectTestConfig;
    }
  }

  // Check for the exact config name in the project
  const projectConfigPath = pathResolve(cwd, configName);
  if(existsSync(projectConfigPath)) {
    return projectConfigPath;
  }

  // Otherwise, use Lex's config
  const lexDir = LexConfig.getLexDir();
  return pathResolve(lexDir, configName);
}

export class LexConfig {
  static config: LexConfigType = {
    ...defaultConfigValues
  };

  /**
   * Get the Lex package root directory, handling both development and installed environments
   */
  static getLexDir(): string {
    // Always use the directory of Lex's own package.json
    return dirname(getLexPackageJsonPath());
  }

  static set useTypescript(value: boolean) {
    LexConfig.config.useTypescript = value;
    const {sourceFullPath} = LexConfig.config;

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

  static updateConfig(updatedConfig: LexConfigType): LexConfigType {
    const {outputFullPath, outputPath, sourcePath, sourceFullPath, useTypescript, ai} = updatedConfig;
    const cwd: string = process.cwd();

    if(useTypescript !== undefined) {
      LexConfig.useTypescript = useTypescript;
    }

    if(outputPath !== undefined && outputFullPath === undefined) {
      updatedConfig.outputFullPath = pathResolve(cwd, outputPath);
    }

    if(sourcePath !== undefined && sourceFullPath === undefined) {
      updatedConfig.sourceFullPath = pathResolve(cwd, sourcePath);
    }

    if(ai) {
      LexConfig.config.ai = {...LexConfig.config.ai, ...ai};

      if(process.env.CURSOR_IDE === 'true' && LexConfig.config.ai.provider === 'none') {
        LexConfig.config.ai.provider = 'cursor';
      }
    }

    LexConfig.config = {...LexConfig.config, ...updatedConfig};

    return LexConfig.config;
  }

  static addConfigParams(cmd, params: LexConfigType) {
    const nameProperty: string = '_name';
    const {environment, outputPath, sourcePath, typescript} = cmd;

    if(outputPath !== undefined) {
      params.outputPath = outputPath;
      params.outputFullPath = pathResolve(cwd, outputPath);
    }

    if(sourcePath !== undefined) {
      params.sourcePath = sourcePath;
      params.sourceFullPath = pathResolve(cwd, sourcePath);
    }

    if(typescript !== undefined) {
      params.useTypescript = true;
    }

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

  static async parseConfig(cmd, isRoot: boolean = true): Promise<void> {
    const {cliName = 'Lex', lexConfig, lexConfigName, quiet, typescript, debug = false} = cmd;
    const configFormats = ['js', 'mjs', 'cjs', 'ts', 'json'];
    const configBaseName: string = lexConfigName || 'lex.config';
    let configPath: string = lexConfig || '';
    let configExists: boolean = lexConfig ? existsSync(configPath) : false;

    if(!configPath || !configExists) {
      if(debug) {
        log(`Searching for config files with base name: ${configBaseName}`, 'info', quiet);
      }

      for(const format of configFormats) {
        const potentialPath = isRoot
          ? pathResolve(cwd, `./${configBaseName}.${format}`)
          : relativeFilePath(`${configBaseName}.${format}`, cwd);

        if(debug) {
          log(`Checking for config file: ${potentialPath}`, 'info', quiet);
        }

        if(existsSync(potentialPath)) {
          configPath = potentialPath;
          configExists = true;
          break;
        }
      }
    }

    if(configExists) {
      log(`Using ${cliName} configuration file: ${configPath}`, 'note', quiet);
      const ext: string = pathExtname(configPath);

      if(ext === '.json') {
        const configContent: string = readFileSync(configPath, 'utf8');

        if(configContent) {
          let configJson: LexConfigType;

          try {
            configJson = JSON.parse(configContent)?.default || {};
          } catch(error) {
            log(`\n${cliName} Error: Failed to parse JSON config: ${error.message}`, 'error', quiet);
            configJson = {};
          }

          LexConfig.addConfigParams(cmd, configJson);
        } else {
          log(`\n${cliName} Error: Config file malformed, ${configPath}`, 'error', quiet);
        }
      } else if(['.js', '.mjs', '.cjs', '.ts'].includes(ext)) {
        try {
          let lexCustomConfig;

          if(ext === '.cjs') {
            const fileUrl = new URL(`file:///${pathResolve(configPath)}`).href;

            if(debug) {
              log(`Loading CommonJS config from: ${fileUrl}`, 'info', quiet);
            }
            lexCustomConfig = await import(fileUrl);
          } else {
            if(debug) {
              log(`Loading ESM/TS config from: ${configPath}`, 'info', quiet);
            }

            lexCustomConfig = await import(configPath);
          }

          const config = lexCustomConfig.default || lexCustomConfig;

          if(debug) {
            log(`Loaded config: ${JSON.stringify(config, null, 2)}`, 'info', quiet);
          }

          if(!config) {
            log(`\n${cliName} Warning: Config file loaded but no configuration found`, 'warn', quiet);
          }

          LexConfig.addConfigParams(cmd, config || {});
        } catch(error) {
          log(`\n${cliName} Error: Failed to load config file: ${error.message}`, 'error', quiet);
          if(debug) {
            console.error(error);
          }
        }
      } else {
        log(`\n${cliName} Error: Config file must be a JS, CJS, MJS, TS, or JSON file.`, 'error', quiet);
      }
    } else {
      if(debug) {
        log('No config file found. Using default configuration.', 'info', quiet);
      }

      LexConfig.useTypescript = !!typescript;
      LexConfig.addConfigParams(cmd, LexConfig.config);
    }
  }

  static checkTypescriptConfig() {
    const tsconfigPath: string = pathResolve(cwd, './tsconfig.json');

    if(!existsSync(tsconfigPath)) {
      const dirName = getDirName();
      writeFileSync(tsconfigPath, readFileSync(pathResolve(dirName, '../../../tsconfig.base.json')));
    }
  }

  static checkCompileTypescriptConfig() {
    const lexDir = LexConfig.getLexDir();
    const tsconfigCompilePath: string = pathResolve(lexDir, './tsconfig.build.json');

    if(!existsSync(tsconfigCompilePath)) {
      // Try to copy from the template location
      const templatePath = pathResolve(lexDir, 'tsconfig.build.json');
      if(existsSync(templatePath)) {
        writeFileSync(tsconfigCompilePath, readFileSync(templatePath));
      }
    }
  }

  static checkLintTypescriptConfig() {
    const lexDir = LexConfig.getLexDir();
    const tsconfigLintPath: string = pathResolve(lexDir, './tsconfig.lint.json');

    if(!existsSync(tsconfigLintPath)) {
      // Try to copy from the template location
      const templatePath = pathResolve(lexDir, 'tsconfig.lint.json');
      if(existsSync(templatePath)) {
        writeFileSync(tsconfigLintPath, readFileSync(templatePath));
      }
    }
  }

  static checkTestTypescriptConfig() {
    const lexDir = LexConfig.getLexDir();
    const tsconfigTestPath: string = pathResolve(lexDir, './tsconfig.test.json');

    if(!existsSync(tsconfigTestPath)) {
      // Try to copy from the template location
      const templatePath = pathResolve(lexDir, 'tsconfig.test.json');
      if(existsSync(templatePath)) {
        writeFileSync(tsconfigTestPath, readFileSync(templatePath));
      }
    }
  }
}