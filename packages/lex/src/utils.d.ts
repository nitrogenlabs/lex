export declare const log: (message: string, type?: string, quiet?: boolean) => void;
export declare const createSpinner: (quiet?: boolean) => any;
export declare const getPackageJson: (packagePath?: string) => any;
export declare const setPackageJson: (json: any, packagePath?: string) => void;
export interface LinkedModuleType {
    readonly name: string;
    readonly path: string;
}
export declare const linkedModules: (startPath?: string) => LinkedModuleType[];
export declare const checkLinkedModules: () => void;
export declare const relativeFilePath: (filename: string, nodePath: string, backUp?: number) => any;
