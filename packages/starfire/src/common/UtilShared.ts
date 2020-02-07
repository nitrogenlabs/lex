import {
  getNextNonSpaceNonCommentCharacterIndex as utilGetNextNonSpaceNonCommentCharacterIndex,
  isNextLineEmpty as utilIsNextLineEmpty,
  isPreviousLineEmpty as utilIsPreviousLineEmpty
} from './util';

export {
  addDanglingComment,
  addLeadingComment,
  addTrailingComment,
  getAlignmentSize,
  getIndentSize,
  getMaxContinuousCount,
  getStringWidth,
  hasNewline,
  hasNewlineInRange,
  hasSpaces,
  isNextLineEmptyAfterIndex,
  makeString,
  skip,
  skipEverythingButNewLine,
  skipInlineComment,
  skipNewline,
  skipSpaces,
  skipToLineEnd,
  skipWhitespace,
  skipTrailingComment
} from './util';

export const isNextLineEmpty = (text, node, options) => utilIsNextLineEmpty(text, node, options.locEnd);
export const isPreviousLineEmpty = (text, node, options) => utilIsPreviousLineEmpty(text, node, options.locStart);
export const getNextNonSpaceNonCommentCharacterIndex = (text, node, options) =>
  utilGetNextNonSpaceNonCommentCharacterIndex(text, node, options.locEnd);
