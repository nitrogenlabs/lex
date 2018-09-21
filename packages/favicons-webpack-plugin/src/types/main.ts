declare module 'webpack' {
  namespace loader {
    interface LoaderContext {
      rootContext: string;
    }
  }
}

export interface FaviconsPluginOptions {
  readonly background?: string;
  readonly emitStats?: boolean;
  readonly icons?: FaviconsPluginIconTypes;
  readonly inject?: boolean;
  readonly logo: string;
  readonly persistentCache?: boolean;
  readonly prefix?: string;
  readonly statsFilename?: string;
  readonly title?: string;
}

export interface FaviconsPluginCache {
  readonly hash: string;
  readonly optionHash: string;
  readonly result?: string;
  readonly version: string;
}

export interface FaviconsPluginIconTypes {
  readonly android?: boolean;
  readonly appleIcon?: boolean;
  readonly appleStartup?: boolean;
  readonly coast?: boolean;
  readonly favicons?: boolean;
  readonly firefox?: boolean;
  readonly opengraph?: boolean;
  readonly twitter?: boolean;
  readonly yandex?: boolean;
  readonly windows?: boolean;
}
