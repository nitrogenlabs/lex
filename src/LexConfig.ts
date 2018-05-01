import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

export interface LexConfigType {
  entryFile?: string;
  jestSetupFile: string;
  outputDir?: string;
  sourceDir?: string;
}

export class LexConfig {
  static config: LexConfigType = {
    entryFile: 'app.tsx',
    jestSetupFile: '',
    outputDir: './dist',
    sourceDir: './src'
  };

  static updateConfig(updatedConfig: LexConfigType): LexConfigType {
    return {...LexConfig.config, ...updatedConfig};
  }

  // Get configuration
  static parseConfig(configPath: string): void {
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
  }
}
