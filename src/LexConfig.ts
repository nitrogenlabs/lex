/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import findFileUp from 'find-file-up';
import {existsSync, readFileSync, writeFileSync} from 'fs';
import {
  dirname,
  extname as pathExtname,
  relative as pathRelative,
  resolve as pathResolve
} from 'path';
import {URL} from 'url';

import {getLexPackageJsonPath, relativeFilePath} from './utils/file.js';
import {log} from './utils/log.js';

import type {Options} from '@swc/core';
import type {Linter} from 'eslint';

const cwd: string = process.cwd();


export interface JestConfig {
  [key: string]: unknown;
  roots?: string[];
  testEnvironment?: string;
  transform?: Record<string, [string, Record<string, unknown>]>;
  transformIgnorePatterns?: string[];
  moduleNameMapper?: Record<string, string>;
  extensionsToTreatAsEsm?: string[];
  preset?: string;
}

export interface WebpackConfig {
  [key: string]: unknown;
  entry?: string | string[];
  output?: Record<string, unknown>;
  module?: Record<string, unknown>;
  plugins?: unknown[];
  staticPath?: string;
}

export interface AIConfig {
  provider?: 'cursor' | 'copilot' | 'openai' | 'anthropic' | 'none';
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ESLintConfig {
  [key: string]: unknown;
  extends?: string[];
  rules?: Linter.RulesRecord;
}

export interface LexConfigType {
  ai?: AIConfig;
  configFiles?: string[];
  copyFiles?: string[];
  entryHTML?: string;
  entryJs?: string;
  env?: object;
  eslint?: ESLintConfig;
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
  swc?: SWCOptions;
  targetEnvironment?: 'node' | 'web';
  useGraphQl?: boolean;
  useTypescript?: boolean;
  webpack?: WebpackConfig;
}

export type Config = LexConfigType;

export const defaultConfigValues: LexConfigType = {
  ai: {
    maxTokens: 4000,
    model: 'gpt-4o',
    provider: 'none',
    temperature: 0.1
  },
  configFiles: [],
  copyFiles: [],
  entryHTML: 'index.html',
  entryJs: 'index.js',
  env: null,
  eslint: {},
  jest: {},
  outputFullPath: pathResolve(cwd, './lib'),
  outputHash: false,
  outputPath: './lib',
  packageManager: 'npm',
  preset: 'web',
  sourceFullPath: pathResolve(cwd, './src'),
  sourcePath: './src',
  swc: {
    inlineSourcesContent: true,
    isModule: true,
    jsc: {
      externalHelpers: false,
      keepClassNames: false,
      loose: false,
      parser: {
        decorators: true,
        dynamicImport: true,
        syntax: 'typescript',
        tsx: true
      },
      target: 'es2023',
      transform: {
        react: {
          runtime: 'automatic'
        }
      }
    },
    minify: false,
    module: {
      lazy: false,
      noInterop: false,
      strict: false,
      strictMode: true,
      type: 'es6'
    },
    sourceMaps: 'inline'
  },
  targetEnvironment: 'web',
  useGraphQl: false,
  useTypescript: false,
  webpack: {
    staticPath: './src/static'
  }
};

export const getPackageDir = (): string => {
  const cwd = process.cwd();
  const currentPkgPath = pathResolve(cwd, 'package.json');

  if(existsSync(currentPkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(currentPkgPath, 'utf8'));
      if(!pkg.workspaces) {
        return cwd;
      }
    } catch{
      return cwd;
    }
  }

  let searchDir = cwd;

  for(let i = 0; i < 10; i++) {
    const pkgPath = pathResolve(searchDir, 'package.json');
    if(existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

        if(!pkg.workspaces) {
          return searchDir;
        }
      } catch{
        // Continue searching
      }
    }

    const parent = dirname(searchDir);

    if(parent === searchDir) {
      break;
    }
    searchDir = parent;
  }

  const configFormats = ['js', 'mjs', 'cjs', 'ts', 'json'];

  for(const format of configFormats) {
    const configPath = findFileUp.sync(`lex.config.${format}`, cwd, 5);

    if(configPath) {
      return dirname(configPath);
    }
  }

  return cwd;
};

export const getTypeScriptConfigPath = (configName: string): string => {
  const packageDir = getPackageDir();
  const cwd = process.cwd();

  if(configName === 'tsconfig.build.json') {
    const projectBuildConfig = pathResolve(packageDir, 'tsconfig.build.json');

    if(existsSync(projectBuildConfig)) {
      return projectBuildConfig;
    }

    const rootBuildConfig = pathResolve(cwd, 'tsconfig.build.json');
    if(existsSync(rootBuildConfig)) {
      return rootBuildConfig;
    }
  }

  if(configName === 'tsconfig.lint.json') {
    const projectLintConfig = pathResolve(packageDir, 'tsconfig.eslint.json');
    if(existsSync(projectLintConfig)) {
      return projectLintConfig;
    }

    const rootLintConfig = pathResolve(cwd, 'tsconfig.eslint.json');

    if(existsSync(rootLintConfig)) {
      return rootLintConfig;
    }
  }

  if(configName === 'tsconfig.test.json') {
    const projectTestConfig = pathResolve(packageDir, 'tsconfig.test.json');
    if(existsSync(projectTestConfig)) {
      return projectTestConfig;
    }

    const rootTestConfig = pathResolve(cwd, 'tsconfig.test.json');

    if(existsSync(rootTestConfig)) {
      return rootTestConfig;
    }
  }

  const projectConfigPath = pathResolve(packageDir, configName);

  if(existsSync(projectConfigPath)) {
    return projectConfigPath;
  }

  const rootConfigPath = pathResolve(cwd, configName);

  if(existsSync(rootConfigPath)) {
    return rootConfigPath;
  }

  const lexDir = LexConfig.getLexDir();

  return pathResolve(lexDir, configName);
};

export class LexConfig {
  static config: LexConfigType = {
    ...defaultConfigValues
  };

  static set useTypescript(value: boolean) {
    LexConfig.config.useTypescript = value;
    const {entryJs, sourceFullPath, targetEnvironment} = LexConfig.config;

    if(entryJs === 'index.js' && value) {
      const indexPath: string = pathResolve(cwd, sourceFullPath, 'index.tsx');
      const hasIndexTsx: boolean = existsSync(indexPath);

      if(hasIndexTsx) {
        LexConfig.config.entryJs = 'index.tsx';
      } else {
        LexConfig.config.entryJs = 'index.ts';
      }
    }

    LexConfig.config.swc.jsc.parser = {
      syntax: 'typescript',
      tsx: true
    };

    if(targetEnvironment === 'web') {
      LexConfig.config.swc.jsc.transform = {
        react: {
          runtime: 'automatic'
        }
      };
    }
  }

  static getLexDir(): string {
    return dirname(getLexPackageJsonPath());
  }

  static updateConfig(updatedConfig: LexConfigType): LexConfigType {
    const {outputFullPath, outputPath, sourcePath, sourceFullPath, useTypescript, ai} = updatedConfig;
    const packageDir = getPackageDir();

    if(useTypescript !== undefined) {
      LexConfig.useTypescript = useTypescript;
    }

    if(outputPath !== undefined && outputFullPath === undefined) {
      updatedConfig.outputFullPath = pathResolve(packageDir, outputPath);
    }

    if(sourcePath !== undefined && sourceFullPath === undefined) {
      updatedConfig.sourceFullPath = pathResolve(packageDir, sourcePath);
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
    const packageDir = getPackageDir();

    if(outputPath !== undefined) {
      params.outputPath = outputPath;
      params.outputFullPath = pathResolve(packageDir, outputPath);
    } else if(params.outputPath && !params.outputFullPath) {
      params.outputFullPath = pathResolve(packageDir, params.outputPath);
    }

    if(sourcePath !== undefined) {
      params.sourcePath = sourcePath;
      params.sourceFullPath = pathResolve(packageDir, sourcePath);
    } else if(params.sourcePath && !params.sourceFullPath) {
      params.sourceFullPath = pathResolve(packageDir, params.sourcePath);
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
            // eslint-disable-next-line no-console
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
    const packageDir = getPackageDir();
    const tsconfigPath: string = pathResolve(packageDir, './tsconfig.json');

    if(!existsSync(tsconfigPath)) {
      const lexDir = LexConfig.getLexDir();
      const baseConfigPath = pathResolve(lexDir, 'tsconfig.base.json');
      const templateConfigPath = pathResolve(lexDir, 'tsconfig.template.json');
      const sourcePath = existsSync(baseConfigPath) ? baseConfigPath : templateConfigPath;

      if(existsSync(sourcePath)) {
        writeFileSync(tsconfigPath, readFileSync(sourcePath));
      }
    }
  }

  static getTypeScriptDeclarationFlags(): string[] {
    const cwd = process.cwd();
    const outputPath = LexConfig.config.outputPath || './lib';
    const outputFullPath = LexConfig.config.outputFullPath || pathResolve(cwd, outputPath);
    const sourcePath = LexConfig.config.sourcePath || './src';
    const sourceFullPath = LexConfig.config.sourceFullPath || pathResolve(cwd, sourcePath);
    const relativeOutDir = pathRelative(cwd, outputFullPath) || './lib';
    const relativeRootDir = pathRelative(cwd, sourceFullPath) || './src';

    return [
      '--emitDeclarationOnly', // CRITICAL: Only emit .d.ts files, no JS files
      '--declaration', // Generate declaration files
      '--declarationMap', // Generate source maps for declarations
      '--outDir', relativeOutDir,
      '--rootDir', relativeRootDir,
      '--skipLibCheck', // Skip type checking of declaration files (faster, more lenient)
      '--esModuleInterop',
      '--allowSyntheticDefaultImports',
      '--module', 'NodeNext',
      '--moduleResolution', 'NodeNext',
      '--target', 'ESNext',
      '--jsx', 'react-jsx',
      '--isolatedModules',
      '--resolveJsonModule',
      '--allowJs'
      // Note: --noUnusedLocals and --noUnusedParameters are not needed for declaration generation
      // and would actually enable strict checking, which we want to avoid for faster declaration generation
    ];
  }

  static checkLintTypescriptConfig() {
    const lexDir = LexConfig.getLexDir();
    const tsconfigLintPath: string = pathResolve(lexDir, './tsconfig.lint.json');

    if(!existsSync(tsconfigLintPath)) {
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
      const templatePath = pathResolve(lexDir, 'tsconfig.test.json');
      if(existsSync(templatePath)) {
        writeFileSync(tsconfigTestPath, readFileSync(templatePath));
      }
    }
  }
}

export type SWCOptions = Options;