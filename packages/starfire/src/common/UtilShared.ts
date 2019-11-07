import {Util} from './util';

export class UtilShared {
  static isNextLineEmpty(text, node, options) {
    return Util.isNextLineEmpty(text, node, options.locEnd);
  }

  static getNextNonSpaceNonCommentCharacterIndex(text, node, options) {
    return Util.getNextNonSpaceNonCommentCharacterIndex(text, node, options.locEnd);
  }
}
