export type SFDocumentType = 'align' | 'break-parent' | 'concat' | 'fill' | 'group' | 'if-break' | 'indent' | 'line' | 'line-suffix' | 'line-suffix-boundary' | 'root' | 'trim';
export type SFPart = SFDocument | string;

export interface SFDocument {
  readonly break?: any;
  readonly breakContents?: any;
  readonly contents?: any;
  readonly expandedStates?: any;
  readonly flatContents?: any;
  readonly groupId?: string;
  readonly hard?: boolean;
  readonly id?: string;
  readonly literal?: boolean;
  readonly parts?: SFPart[];
  readonly n?: SFDocument | number;
  readonly soft?: any;
  readonly type?: SFDocumentType;
}

export interface SFDocumentOptions {
  readonly expandedStates?: any;
  readonly groupId?: string;
  readonly id?: string;
  readonly shouldBreak?: boolean;
}
