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
}
