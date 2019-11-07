import chalk from 'chalk';
import * as find from 'find-file-up';
import * as fs from 'fs';
import * as path from 'path';

const cwd: string = process.cwd();

export interface StarfireConfigType {
  sourceDir?: string;
  useTypescript: boolean;
}

export class StarfireConfig {
  static config: StarfireConfigType = {
    sourceDir: path.resolve(cwd, './src'),
    useTypescript: false
  };

  static updateConfig(updatedConfig: StarfireConfigType): StarfireConfigType {
    const {useTypescript} = updatedConfig;

    if(useTypescript !== undefined) {
      StarfireConfig.useTypescript = useTypescript;
    }

    return {...StarfireConfig.config, ...updatedConfig};
  }

  static set useTypescript(value: boolean) {
    StarfireConfig.config.useTypescript = value;
  }

  // Get configuration
  static parseConfig(cmd, isRoot: boolean = true) {
    const defaultConfigPath: string = isRoot ?
      path.resolve(cwd, './starfire.config.js') :
      find.sync('starfire.config.js', cwd, 5);
    const configPath: string = cmd.starfireConfig || defaultConfigPath;

    // If user has a Starfire config file, lets use it.
    if(fs.existsSync(configPath)) {
      console.log(chalk.gray('Starfire Config:', configPath));
      const ext: string = path.extname(configPath);

      if(ext === '.json') {
        const configContent: string = fs.readFileSync(configPath, 'utf8');

        if(configContent) {
          const configJson: StarfireConfigType = JSON.parse(configContent);

          // Determine if we're using Typescript or Flow
          if(cmd.typescript !== undefined) {
            configJson.useTypescript = cmd.typescript;
          }

          process.env.STARFIRE_CONFIG = JSON.stringify(StarfireConfig.updateConfig(configJson), null, 0);
        } else {
          console.error(chalk.red(`Config file malformed, ${configPath}`));
        }
      } else if(ext === '.js') {
        const starfireCustomConfig = require(configPath);
        process.env.STARFIRE_CONFIG = JSON.stringify(StarfireConfig.updateConfig(starfireCustomConfig), null, 0);
      } else {
        console.error(chalk.red('Config file must be a JS or JSON file.'));
      }
    } else {
      // Determine if we're using Typescript or Flow
      StarfireConfig.useTypescript = !!cmd.typescript;

      // Save config as environment variable for other commands to include
      process.env.STARFIRE_CONFIG = JSON.stringify(StarfireConfig.config, null, 0);
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
