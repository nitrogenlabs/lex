export type SFTrailingCommaType = 'none';
export type SFArrowParensType = 'always' | 'avoid';

export interface SFOptionsType {
  arrowParens?: SFArrowParensType;
  bracketSpacing?: boolean;
  jsxBracketSameLine?: boolean;
  maxLineLength?: number;
  semi?: boolean;
  singleQuote?: boolean;
  tabWidth?: number;
  trailingComma?: SFTrailingCommaType;
  useTabs?: boolean;
}

export interface SFLanguageOptionsType extends SFOptionsType {
  readonly astFormat?: any;
  cursorNode?: any;
  readonly cursorOffset?: number;
  readonly filePath?: string;
  readonly inferParser?: any;
  readonly insertPragma?: boolean;
  readonly locEnd?: any;
  readonly locStart?: any;
  newLine?: string;
  originalText?: string;
  readonly parser?: any;
  readonly plugins?: any;
  readonly printer?: any;
  readonly proseWrap?: string;
  readonly rangeEnd?: any;
  readonly rangeStart?: any;
  readonly requirePragma?: boolean;
}

export interface SFRawOptionsType {

}

