export interface StaticSitePluginOptions {
  readonly crawl?: boolean;
  readonly entry?: string;
  readonly globals?: string[];
  readonly locals?: string[];
  readonly paths?: string[];
}

export interface StaticSiteRenderPaths {
  assets?: any;
  compilation?: any;
  crawl?: boolean;
  locals?: any;
  paths?: string[];
  relativePaths?: string[];
  render?: any;
  userLocals?: string[];
  webpackStats?: any;
}
