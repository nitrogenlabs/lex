import {Loader} from 'esbuild';

export interface Options {
  readonly jsxFactory?: string;
  readonly jsxFragment?: string;
  readonly sourcemap?: boolean | 'inline' | 'external';
  readonly loaders?: {
    [ext: string]: Loader
  };
  readonly presets?: string[];
  readonly target?: string;
  readonly format?: string;
}