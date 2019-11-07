export interface SFASTType {
  comments: SFCommentsType[];
  tokens: any;
}

export interface SFCommentOptionsType {
  readonly attach: any;
  originalText: string;
}

export interface SFCommentsType {
  printed: any;
  value: string;
}
