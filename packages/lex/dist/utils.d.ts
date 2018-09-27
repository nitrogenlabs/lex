export declare const cwd: string;
export declare const log: (message: string, type?: string, quiet?: boolean) => void;
export declare const getFilenames: (props: any) => any;
export declare const createSpinner: (quiet?: boolean) => any;
export declare const copyFiles: (files: string[], outputDir: string, typeName: string, spinner: any) => Promise<void>;
export declare const copyFileSync: (source: string, target: string) => void;
export declare const copyFolderRecursiveSync: (source: string, target: string) => void;
export declare const getPackageJson: (packagePath?: string) => any;
export declare const removeFiles: (fileName: string, isRelative?: boolean) => Promise<{}>;
export declare const setPackageJson: (json: any, packagePath?: string) => void;
export interface LinkedModuleType {
    readonly name: string;
    readonly path: string;
}
export declare const linkedModules: (startPath?: string) => LinkedModuleType[];
export declare const checkLinkedModules: () => void;
export declare const relativeFilePath: (filename: string, nodePath: string, backUp?: number) => any;
export declare const updateTemplateName: (filePath: string, replace: string, replaceCaps: string) => void;
