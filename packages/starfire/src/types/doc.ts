export interface SFDocumentType {
  break?: boolean;
  contents?: any;
  expandedStates?: any;
  type: string;
}

export type SFParserFormat = 'estree';

export interface SFParserType {
  readonly astFormat: SFParserFormat;
  readonly hasPragma?: (text: string) => boolean;
  readonly locEnd: any;
  readonly locStart: any;
  readonly printer?: any;
  readonly parse?: any;
  readonly preprocess?: any;
}

export interface SFCondtionalOptionsType {
  expandedStates?: any;
  shouldBreak?: boolean;
}
