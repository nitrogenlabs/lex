import { StaticSitePluginOptions } from './types/main';
export declare class StaticSitePlugin {
    options: StaticSitePluginOptions;
    constructor(options?: StaticSitePluginOptions);
    static renderPaths(crawl: boolean, userLocals: string[], paths: string[], render: any, assets: any, webpackStats: any, compilation: any): Promise<any>;
    static findAsset(src: string, compilation: any, webpackStatsJson: any): any;
    static getAssetsFromCompilation(compilation: any, webpackStatsJson: any): {};
    static pathToAssetName(outputPath: string): string;
    static makeObject(key: string, value: string): {
        [x: string]: string;
    };
    static relativePathsFromHtml(options: any): string[];
    apply(compiler: any): void;
}
