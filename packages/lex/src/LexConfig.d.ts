export interface LexConfigType {
    babelPlugins?: string[];
    babelPresets?: string[];
    entryHTML?: string;
    entryJS?: string;
    env?: object;
    gitUrl?: string;
    libraryName?: string;
    libraryTarget?: string;
    outputFile?: string;
    outputFullPath?: string;
    outputHash?: boolean;
    outputPath?: string;
    packageManager?: string;
    sourceFullPath?: string;
    sourcePath?: string;
    targetEnvironment?: 'node' | 'web';
    useTypescript?: boolean;
}
export declare class LexConfig {
    static config: LexConfigType;
    static updateConfig(updatedConfig: LexConfigType): LexConfigType;
    static useTypescript: boolean;
    static addConfigParams(cmd: any, params: LexConfigType): void;
    static parseConfig(cmd: any, isRoot?: boolean): void;
    static checkTypescriptConfig(): void;
}
