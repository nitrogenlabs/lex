import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

const cwd: string = process.cwd();

export interface LexConfigType {
  entryHTML?: string;
  entryJS?: string;
  env: object;
  outputDir?: string;
  sourceDir?: string;
}

export class LexConfig {
  static config: LexConfigType = {
    entryHTML: 'index.html',
    entryJS: 'app.tsx',
    env: null,
    outputDir: path.resolve(cwd, './dist'),
    sourceDir: path.resolve(cwd, './src')
  };

  static updateConfig(updatedConfig: LexConfigType): LexConfigType {
    return {...LexConfig.config, ...updatedConfig};
  }

  // Get configuration
  static parseConfig(configPath: string) {
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
