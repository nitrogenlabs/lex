import * as find from 'find-file-up';
import * as fs from 'fs';
import * as path from 'path';

import {log} from './utils';

const cwd: string = process.cwd();

export interface LexConfigType {
  babelPlugins?: string[];
  babelPresets?: string[];
  entryHTML?: string;
  entryJS?: string;
  env?: object;
  libraryName?: string;
  libraryTarget?: string;
  outputFilename?: string;
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
    babelPlugins: [],
    babelPresets: [],
    entryHTML: 'index.html',
    entryJS: 'index.js',
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
    const {sourceFullPath} = LexConfig.config;

    // Make sure we change the default entry file if Typescript is being used.
    const {entryJS} = LexConfig.config;

    if(entryJS === 'index.js' && value) {
      const indexPath: string = path.resolve(cwd, sourceFullPath, 'index.tsx');
      const hasIndexTsx: boolean = fs.existsSync(indexPath);

      if(hasIndexTsx) {
        LexConfig.config.entryJS = 'index.tsx';
      } else {
        LexConfig.config.entryJS = 'index.ts';
      }
    }
  }

  // Set option updates from the command line
  static addConfigParams(cmd, params: LexConfigType) {
    const nameProperty: string = '_name';
    const {babelPlugins, babelPresets, environment, typescript} = cmd;

    // Determine if we're using Typescript or Flow
    if(typescript !== undefined) {
      params.useTypescript = typescript;
    }

    // Add Babel plugins
    if(babelPlugins !== undefined) {
      const plugins: string[] = babelPlugins.split(',');
      params.babelPlugins = plugins.map((plugin: string) => `${path.resolve(cwd, './node_modules')}/${plugin}}`);
    }

    // Add Babel presets
    if(babelPresets !== undefined) {
      const presets: string[] = babelPresets.split(',');
      params.babelPresets = presets.map((preset: string) => `${path.resolve(cwd, './node_modules')}/${preset}}`);
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
  static parseConfig(cmd, isRoot: boolean = true) {
    const {lexConfig, quiet, typescript} = cmd;
    const defaultConfigPath: string = isRoot ?
      path.resolve(cwd, './lex.config.js') :
      find.sync('lex.config.js', cwd, 5);
    const configPath: string = lexConfig || defaultConfigPath;


    // If user has a Lex config file, lets use it.
    if(fs.existsSync(configPath)) {
      log(`Using Lex configuration file: ${configPath}`, 'note', quiet);
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
          log(`Config file malformed, ${configPath}`, 'error', quiet);
        }
      } else if(ext === '.js') {
        const lexCustomConfig = require(configPath);
        LexConfig.addConfigParams(cmd, lexCustomConfig);
      } else {
        log('Config file must be a JS or JSON file.', 'error', quiet);
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
      fs.writeFileSync(tsconfigPath, fs.readFileSync(path.resolve(__dirname, '../tsconfig.json')));
    }
  }
}
