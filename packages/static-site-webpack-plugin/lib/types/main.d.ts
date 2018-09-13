export interface StaticSitePluginOptions {
    readonly crawl?: boolean;
    readonly entry?: string;
    readonly globals?: string[];
    readonly locals?: string[];
    readonly paths?: string[];
}
