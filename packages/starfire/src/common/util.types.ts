export type SFQuote = '"' | '\'';
export type SFNodeRange = [number, number];

export interface SFNodePosition {
  readonly column: number;
  readonly line: number;
}

export interface SFNodeLocation {
  readonly end?: SFNodePosition;
  readonly source?: any;
  readonly start?: SFNodePosition;
}

export interface SFComment {
  readonly leading?: boolean;
  readonly loc?: SFNodeLocation;
  readonly trailing?: boolean;
  readonly type?: 'Line';
  readonly range?: SFNodeRange;
  readonly value?: string;
}

export interface SFQuoteType {
  readonly quote: SFQuote;
  readonly regex: RegExp;
}

export interface SFSkipOptions {
  readonly backwards?: boolean;
}

export interface SFNode {
  readonly argument: any;
  readonly callee: any;
  readonly comments: SFComment[];
  readonly end?: number;
  readonly expression: any;
  readonly expressions: any[];
  readonly left: SFNode;
  readonly object: any;
  readonly prefix: any;
  readonly printed: boolean;
  readonly range?: SFNodeRange;
  readonly start?: number;
  readonly superClass?: any;
  readonly tag: any;
  readonly test: any;
  readonly type: any;
}
