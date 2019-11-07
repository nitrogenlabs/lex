import getCjkRegex from 'cjk-regex';
import emojiRegex from 'emoji-regex';
import escapeStringRegexp from 'escape-string-regexp';
import {isNil} from 'lodash';
import stringWidth from 'string-width';
import unicode from 'unicode-regex';

import {SFSplitWordType, SFUtilOptionsType} from '../types/util';

export class Util {
  static get asciiPunctuationCharRange() {
    // http://spec.commonmark.org/0.25/#ascii-punctuation-character
    return escapeStringRegexp('!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~');
  }

  static get punctuationCharRange() {
    // http://spec.commonmark.org/0.25/#punctuation-character
    return `${Util.asciiPunctuationCharRange}${unicode({General_Category: ['Punctuation']}).toRegExp()}`;
    // remove bracket expression `[` and `]`
  }

  static get punctuationRegex() {
    return new RegExp(`[${Util.punctuationCharRange}]`);
  }

  static get cjkPattern() {
    return getCjkRegex().toRegExp();
  }

  static isExportDeclaration(node) {
    if(node) {
      switch(node.type) {
        case 'ExportDefaultDeclaration':
        case 'ExportDefaultSpecifier':
        case 'DeclareExportDeclaration':
        case 'ExportNamedDeclaration':
        case 'ExportAllDeclaration':
          return true;
        default:
          return false;
      }
    }

    return false;
  }

  static getParentExportDeclaration(path) {
    const parentNode = path.getParentNode();

    if(path.getName() === 'declaration' && Util.isExportDeclaration(parentNode)) {
      return parentNode;
    }

    return null;
  }

  static getPenultimate(arr) {
    if(arr.length > 1) {
      return arr[arr.length - 2];
    }

    return null;
  }

  static getLast(arr) {
    if(arr.length > 0) {
      return arr[arr.length - 1];
    }

    return null;
  }

  static skip(chars) {
    return (text, index: number, opts: SFUtilOptionsType = {}): number => {
      const {backwards} = opts;

      // Allow `skip` functions to be threaded together without having
      // to check for failures (did someone say monads?).
      if(isNil(index)) {
        return null;
      }

      const {length} = text;
      let cursor: number = index;

      while(cursor >= 0 && cursor < length) {
        const c: string = text.charAt(cursor);

        if(chars instanceof RegExp) {
          if(!chars.test(c)) {
            return cursor;
          }
        } else if(chars.indexOf(c) === -1) {
          return cursor;
        }

        backwards ? cursor-- : cursor++;
      }

      if(cursor === -1 || cursor === length) {
        // If we reached the beginning or end of the file, return the
        // out-of-bounds cursor. It's up to the caller to handle this
        // correctly. We don't want to indicate `false` though if it
        // actually skipped valid characters.
        return cursor;
      }

      return null;
    };
  }

  static get skipWhitespace() {
    return Util.skip(/\s/);
  }

  static get skipSpaces() {
    return Util.skip(' \t');
  }

  static get skipToLineEnd() {
    return Util.skip(',; \t');
  }

  static get skipEverythingButNewLine() {
    return Util.skip(/[^\r\n]/);
  }

  static skipInlineComment(text: string, index: number): number {
    if(isNil(index)) {
      return null;
    }

    if(text.charAt(index) === '/' && text.charAt(index + 1) === '*') {
      for(let i = index + 2; i < text.length; ++i) {
        if(text.charAt(i) === '*' && text.charAt(i + 1) === '/') {
          return i + 2;
        }
      }
    }

    return index;
  }

  static skipTrailingComment(text: string, index: number): number {
    if(isNil(index)) {
      return null;
    }

    if(text.charAt(index) === '/' && text.charAt(index + 1) === '/') {
      return Util.skipEverythingButNewLine(text, index);
    }

    return index;
  }

  // This one doesn't use the above helper function because it wants to
  // test \r\n in order and `skip` doesn't support ordering and we only
  // want to skip one newline. It's simple to implement.
  static skipNewline(text, index, opts: SFUtilOptionsType = {}): number {
    const {backwards} = opts;

    if(isNil(index)) {
      return null;
    }

    const atIndex: string = text.charAt(index);

    if(backwards) {
      if(text.charAt(index - 1) === '\r' && atIndex === '\n') {
        return index - 2;
      }

      if(atIndex === '\n' || atIndex === '\r' || atIndex === '\u2028' || atIndex === '\u2029') {
        return index - 1;
      }
    } else {
      if(atIndex === '\r' && text.charAt(index + 1) === '\n') {
        return index + 2;
      }

      if(atIndex === '\n' || atIndex === '\r' || atIndex === '\u2028' || atIndex === '\u2029') {
        return index + 1;
      }
    }

    return index;
  }

  static hasNewline(text: string, index: number, opts: SFUtilOptionsType = {}): boolean {
    const idx: number = Util.skipSpaces(text, opts.backwards ? index - 1 : index, opts);
    const idxUpdated: number = Util.skipNewline(text, idx, opts);

    return idx !== idxUpdated;
  }

  static hasNewlineInRange(text: string, start: number, end: number): boolean {
    for(let i = start; i < end; ++i) {
      if(text.charAt(i) === '\n') {
        return true;
      }
    }

    return false;
  }

  // Note: this function doesn't ignore leading comments unlike isNextLineEmpty
  static isPreviousLineEmpty(text: string, node, locStart): boolean {
    const idxStart: number = locStart(node) - 1;
    const idxSpace: number = Util.skipSpaces(text, idxStart, {backwards: true});
    const idxLine: number = Util.skipNewline(text, idxSpace, {backwards: true});
    const idxNext: number = Util.skipSpaces(text, idxLine, {backwards: true});
    const idxUpdated: number = Util.skipNewline(text, idxNext, {backwards: true});

    return idxNext !== idxUpdated;
  }

  static isNextLineEmptyAfterIndex(text: string, index: number) {
    let oldIdx: number = null;
    let idx: number = index;

    while(idx !== oldIdx) {
      // We need to skip all the potential trailing inline comments
      oldIdx = idx;
      idx = Util.skipSpaces(text, Util.skipInlineComment(text, Util.skipToLineEnd(text, idx)));
    }

    const idxTrail: number = Util.skipTrailingComment(text, idx);
    const idxUpdated: number = Util.skipNewline(text, idxTrail);

    return Util.hasNewline(text, idxUpdated);
  }

  static isNextLineEmpty(text: string, node, locEnd) {
    return Util.isNextLineEmptyAfterIndex(text, locEnd(node));
  }

  static getNextNonSpaceNonCommentCharacterIndex(text: string, node, locEnd): number {
    let oldIdx: number;
    let idx: number = locEnd(node);

    while(idx !== oldIdx) {
      oldIdx = idx;
      idx = Util.skipSpaces(text, idx);
      idx = Util.skipInlineComment(text, idx);
      idx = Util.skipTrailingComment(text, idx);
      idx = Util.skipNewline(text, idx);
    }
    return idx;
  }

  static getNextNonSpaceNonCommentCharacter(text: string, node, locEnd) {
    return text.charAt(Util.getNextNonSpaceNonCommentCharacterIndex(text, node, locEnd));
  }

  static hasSpaces(text, index, opts) {
    opts = opts || {};
    const idx = Util.skipSpaces(text, opts.backwards ? index - 1 : index, opts);
    return idx !== index;
  }

  // Super inefficient, needs to be cached.
  static lineColumnToIndex(lineColumn, text) {
    let index: number = 0;

    for(let i = 0; i < lineColumn.line - 1; ++i) {
      index = text.indexOf('\n', index) + 1;

      if(index === -1) {
        return -1;
      }
    }
    return index + lineColumn.column;
  }

  static setLocStart(node, index: number) {
    if(node.range) {
      node.range[0] = index;
    } else {
      node.start = index;
    }
  }

  static setLocEnd(node, index: number) {
    if(node.range) {
      node.range[1] = index;
    } else {
      node.end = index;
    }
  }

  static get PRECEDENCE() {
    return [
      ['|>'],
      ['||', '??'],
      ['&&'],
      ['|'],
      ['^'],
      ['&'],
      ['==', '===', '!=', '!=='],
      ['<', '>', '<=', '>=', 'in', 'instanceof'],
      ['>>', '<<', '>>>'],
      ['+', '-'],
      ['*', '/', '%'],
      ['**']
    ].reduce((priority, ops) => {
      ops.forEach((op, i) => priority[op] = Object.keys(priority).length);
      return priority;
    }, {});
  }

  static getPrecedence(op) {
    return Util.PRECEDENCE[op];
  }

  static equalityOperators = {
    '!=': true,
    '!==': true,
    '==': true,
    '===': true
  };

  static multiplicativeOperators = {
    '%': true,
    '*': true,
    '/': true
  };

  static bitshiftOperators = {
    '<<': true,
    '>>': true,
    '>>>': true
  };

  static shouldFlatten(parentOp, nodeOp) {
    if(Util.getPrecedence(nodeOp) !== Util.getPrecedence(parentOp)) {
      return false;
    }

    // ** is right-associative
    // x ** y ** z --> x ** (y ** z)
    if(parentOp === '**') {
      return false;
    }

    // x == y == z --> (x == y) == z
    if(Util.equalityOperators[parentOp] && Util.equalityOperators[nodeOp]) {
      return false;
    }

    // x * y % z --> (x * y) % z
    if(
      (nodeOp === '%' && Util.multiplicativeOperators[parentOp]) ||
      (parentOp === '%' && Util.multiplicativeOperators[nodeOp])
    ) {
      return false;
    }

    // x << y << z --> (x << y) << z
    if(Util.bitshiftOperators[parentOp] && Util.bitshiftOperators[nodeOp]) {
      return false;
    }

    return true;
  }

  static isBitwiseOperator(operator) {
    return (
      !!Util.bitshiftOperators[operator] ||
      operator === '|' ||
      operator === '^' ||
      operator === '&'
    );
  }

  // Tests if an expression starts with `{`, or (if forbidFunctionAndClass holds) `function` or `class`.
  // Will be overzealous if there's already necessary grouping parentheses.
  static startsWithNoLookaheadToken(node, forbidFunctionAndClass) {
    node = Util.getLeftMost(node);
    switch(node.type) {
      // Hack. Remove after https://github.com/eslint/typescript-eslint-parser/issues/331
      case 'ObjectPattern':
        return !forbidFunctionAndClass;

      case 'FunctionExpression':
      case 'ClassExpression':
        return forbidFunctionAndClass;
      case 'ObjectExpression':
        return true;
      case 'MemberExpression':
        return Util.startsWithNoLookaheadToken(node.object, forbidFunctionAndClass);
      case 'TaggedTemplateExpression':
        if(node.tag.type === 'FunctionExpression') {
          // IIFEs are always already parenthesized
          return false;
        }
        return Util.startsWithNoLookaheadToken(node.tag, forbidFunctionAndClass);
      case 'CallExpression':
        if(node.callee.type === 'FunctionExpression') {
          // IIFEs are always already parenthesized
          return false;
        }
        return Util.startsWithNoLookaheadToken(node.callee, forbidFunctionAndClass);
      case 'ConditionalExpression':
        return Util.startsWithNoLookaheadToken(node.test, forbidFunctionAndClass);
      case 'UpdateExpression':
        return (
          !node.prefix &&
          Util.startsWithNoLookaheadToken(node.argument, forbidFunctionAndClass)
        );
      case 'BindExpression':
        return (
          node.object &&
          Util.startsWithNoLookaheadToken(node.object, forbidFunctionAndClass)
        );
      case 'SequenceExpression':
        return Util.startsWithNoLookaheadToken(
          node.expressions[0],
          forbidFunctionAndClass
        );
      case 'TSAsExpression':
        return Util.startsWithNoLookaheadToken(
          node.expression,
          forbidFunctionAndClass
        );
      default:
        return false;
    }
  }

  static getLeftMost(node) {
    if(node.left) {
      return Util.getLeftMost(node.left);
    }
    return node;
  }

  static hasBlockComments(node) {
    return node.comments && node.comments.some(Util.isBlockComment);
  }

  static isBlockComment(comment) {
    return comment.type === 'Block' || comment.type === 'CommentBlock';
  }

  static hasClosureCompilerTypeCastComment(text, node, locEnd) {
    // https://github.com/google/closure-compiler/wiki/Annotating-Types#type-casts
    // Syntax example: var x = /** @type {string} */ (fruit);
    return (
      node.comments &&
      node.comments.some(
        (comment) =>
          comment.leading &&
          Util.isBlockComment(comment) &&
          comment.value.match(/^\*\s*@type\s*{[^}]+}\s*$/) &&
          Util.getNextNonSpaceNonCommentCharacter(text, comment, locEnd) === '('
      )
    );
  }

  static getAlignmentSize(value: string, tabWidth: number, startIndex: number = 0): number {
    let size: number = 0;

    for(let i = startIndex; i < value.length; ++i) {
      if(value[i] === '\t') {
        // Tabs behave in a way that they are aligned to the nearest
        // multiple of tabWidth:
        // 0 -> 4, 1 -> 4, 2 -> 4, 3 -> 4
        // 4 -> 8, 5 -> 8, 6 -> 8, 7 -> 8 ...
        size = size + tabWidth - size % tabWidth;
      } else {
        size++;
      }
    }

    return size;
  }

  static getIndentSize(value, tabWidth) {
    const lastNewlineIndex = value.lastIndexOf('\n');
    if(lastNewlineIndex === -1) {
      return 0;
    }

    return Util.getAlignmentSize(
      // All the leading whitespaces
      value.slice(lastNewlineIndex + 1).match(/^[ \t]*/)[0],
      tabWidth
    );
  }

  static printString(raw, options, isDirectiveLiteral?) {
    // `rawContent` is the string exactly like it appeared in the input source
    // code, without its enclosing quotes.
    const rawContent = raw.slice(1, -1);

    const double = {quote: '"', regex: /"/g};
    const single = {quote: '\'', regex: /'/g};

    const preferred = options.singleQuote ? single : double;
    const alternate = preferred === single ? double : single;

    let shouldUseAlternateQuote = false;
    let canChangeDirectiveQuotes = false;

    // If `rawContent` contains at least one of the quote preferred for enclosing
    // the string, we might want to enclose with the alternate quote instead, to
    // minimize the number of escaped quotes.
    // Also check for the alternate quote, to determine if we're allowed to swap
    // the quotes on a DirectiveLiteral.
    if(
      rawContent.includes(preferred.quote) ||
      rawContent.includes(alternate.quote)
    ) {
      const numPreferredQuotes = (rawContent.match(preferred.regex) || []).length;
      const numAlternateQuotes = (rawContent.match(alternate.regex) || []).length;

      shouldUseAlternateQuote = numPreferredQuotes > numAlternateQuotes;
    } else {
      canChangeDirectiveQuotes = true;
    }

    const enclosingQuote =
      options.parser === 'json'
        ? double.quote
        : shouldUseAlternateQuote ? alternate.quote : preferred.quote;

    // Directives are exact code unit sequences, which means that you can't
    // change the escape sequences they use.
    // See https://github.com/starfire/starfire/issues/1555
    // and https://tc39.github.io/ecma262/#directive-prologue
    if(isDirectiveLiteral) {
      if(canChangeDirectiveQuotes) {
        return enclosingQuote + rawContent + enclosingQuote;
      }
      return raw;
    }

    // It might sound unnecessary to use `makeString` even if the string already
    // is enclosed with `enclosingQuote`, but it isn't. The string could contain
    // unnecessary escapes (such as in `"\'"`). Always using `makeString` makes
    // sure that we consistently output the minimum amount of escaped quotes.
    return Util.makeString(
      rawContent,
      enclosingQuote,
      !(
        options.parser === 'css' ||
        options.parser === 'less' ||
        options.parser === 'scss'
      )
    );
  }

  static makeString(rawContent, enclosingQuote, unescapeUnnecessaryEscapes) {
    const otherQuote = enclosingQuote === '"' ? '\'' : '"';

    // Matches _any_ escape and unescaped quotes (both single and double).
    const regex = /\\([\s\S])|(['"])/g;

    // Escape and unescape single and double quotes as needed to be able to
    // enclose `rawContent` with `enclosingQuote`.
    const newContent = rawContent.replace(regex, (match, escaped, quote) => {
      // If we matched an escape, and the escaped character is a quote of the
      // other type than we intend to enclose the string with, there's no need for
      // it to be escaped, so return it _without_ the backslash.
      if(escaped === otherQuote) {
        return escaped;
      }

      // If we matched an unescaped quote and it is of the _same_ type as we
      // intend to enclose the string with, it must be escaped, so return it with
      // a backslash.
      if(quote === enclosingQuote) {
        return `\\${quote}`;
      }

      if(quote) {
        return quote;
      }

      // Unescape any unnecessarily escaped character.
      // Adapted from https://github.com/eslint/eslint/blob/de0b4ad7bd820ade41b1f606008bea68683dc11a/lib/rules/no-useless-escape.js#L27
      return unescapeUnnecessaryEscapes && /^[^\\nrvtbfux\r\n\u2028\u2029"'0-7]$/.test(escaped)
        ? escaped
        : `\\${escaped}`;
    });

    return enclosingQuote + newContent + enclosingQuote;
  }

  static printNumber(rawNumber) {
    return (
      rawNumber
        .toLowerCase()
        // Remove unnecessary plus and zeroes from scientific notation.
        .replace(/^([+-]?[\d.]+e)(?:\+|(-))?0*(\d)/, '$1$2$3')
        // Remove unnecessary scientific notation (1e0).
        .replace(/^([+-]?[\d.]+)e[+-]?0+$/, '$1')
        // Make sure numbers always start with a digit.
        .replace(/^([+-])?\./, '$10.')
        // Remove extraneous trailing decimal zeroes.
        .replace(/(\.\d+?)0+(?=e|$)/, '$1')
        // Remove trailing dot.
        .replace(/\.(?=e|$)/, '')
    );
  }

  static getMaxContinuousCount(str, target) {
    const results = str.match(
      new RegExp(`(${escapeStringRegexp(target)})+`, 'g')
    );

    if(results === null) {
      return 0;
    }

    return results.reduce(
      (maxCount, result) => Math.max(maxCount, result.length / target.length),
      0
    );
  }

  static mapDoc(doc, callback) {
    if(doc.parts) {
      const parts = doc.parts.map((part) => Util.mapDoc(part, callback));
      return callback({...doc, parts});
    }

    if(doc.contents) {
      const contents = Util.mapDoc(doc.contents, callback);
      return callback({...doc, contents});
    }

    return callback(doc);
  }

  // Split text into whitespaces and words
  static splitText(text: string): SFSplitWordType[] {
    const KIND_NON_CJK: string = 'non-cjk';
    const KIND_CJK_CHARACTER: string = 'cjk-character';
    const KIND_CJK_PUNCTUATION: string = 'cjk-punctuation';
    const updatedNodes = [];


    const appendNode = (node, nodes) => {
      const lastNode = Util.getLast(nodes);
      const isBetween = (kind1, kind2) => ((lastNode.kind === kind1 && node.kind === kind2) || (lastNode.kind === kind2 && node.kind === kind1));

      if(lastNode && lastNode.type === 'word') {
        if(
          (lastNode.kind === KIND_NON_CJK && node.kind === KIND_CJK_CHARACTER && !lastNode.hasTrailingPunctuation) ||
          (lastNode.kind === KIND_CJK_CHARACTER && node.kind === KIND_NON_CJK && !node.hasLeadingPunctuation)
        ) {
          nodes.push({type: 'whitespace', value: ' '});
        } else if(
          !isBetween(KIND_NON_CJK, KIND_CJK_PUNCTUATION) &&
          // disallow leading/trailing full-width whitespace
          ![lastNode.value, node.value].some((value) => /\u3000/.test(value))
        ) {
          nodes.push({type: 'whitespace', value: ''});
        }
      }

      nodes.push(node);
    };

    text.replace(new RegExp(`(${Util.cjkPattern})\n(${Util.cjkPattern})`, 'g'), '$1$2')
      .split(/([ \t\n]+)/)
      .forEach((token, index, tokens) => {
        // whitespace
        if(index % 2 === 1) {
          updatedNodes.push({type: 'whitespace', value: /\n/.test(token) ? '\n' : '  '});
          return;
        }

        // word separated by whitespace

        if((index === 0 || index === tokens.length - 1) && token === '') {
          return;
        }

        token.split(new RegExp(`(${Util.cjkPattern})`))
          .forEach((innerToken, innerIndex, innerTokens) => {
            if(
              (innerIndex === 0 || innerIndex === innerTokens.length - 1) &&
              innerToken === ''
            ) {
              return;
            }

            // non-CJK word
            if(innerIndex % 2 === 0) {
              if(innerToken !== '') {
                appendNode({
                  hasLeadingPunctuation: Util.punctuationRegex.test(innerToken[0]),
                  hasTrailingPunctuation: Util.punctuationRegex.test(Util.getLast(innerToken)),
                  kind: KIND_NON_CJK,
                  type: 'word',
                  value: innerToken
                }, updatedNodes);
              }

              return;
            }

            // CJK character
            appendNode(
              Util.punctuationRegex.test(innerToken)
                ? {
                  hasLeadingPunctuation: true,
                  hasTrailingPunctuation: true,
                  kind: KIND_CJK_PUNCTUATION,
                  type: 'word',
                  value: innerToken
                }
                : {
                  hasLeadingPunctuation: false,
                  hasTrailingPunctuation: false,
                  kind: KIND_CJK_CHARACTER,
                  type: 'word',
                  value: innerToken
                },
              updatedNodes
            );
          });
      });

    return updatedNodes;
  }

  static getStringWidth(text) {
    if(!text) {
      return 0;
    }

    // emojis are considered 2-char width for consistency
    // see https://github.com/sindresorhus/string-width/issues/11
    // for the reason why not implemented in `string-width`
    const regex: RegExp = emojiRegex();
    return stringWidth(text.replace(regex, '  '));
  }

  static hasIgnoreComment(path) {
    const node = path.getValue();
    return Util.hasNodeIgnoreComment(node);
  }

  static hasNodeIgnoreComment(node) {
    return (
      node &&
      node.comments &&
      node.comments.length > 0 &&
      node.comments.some((comment) => comment.value.trim() === 'starfire-ignore')
    );
  }

  static arrayify(object, keyName) {
    return Object.keys(object).reduce(
      (array, key) =>
        array.concat({[keyName]: key, ...object[key]}),
      []
    );
  }

  static addCommentHelper(node, comment) {
    const comments = node.comments || (node.comments = []);
    comments.push(comment);
    comment.printed = false;

    // For some reason, TypeScript parses `// x` inside of JSXText as a comment
    // We already "print" it via the raw text, we don't need to re-print it as a
    // comment
    if(node.type === 'JSXText') {
      comment.printed = true;
    }
  }

  static addLeadingComment(node, comment) {
    const updatedComment = {
      ...comment,
      leading: true,
      trailing: false
    };
    Util.addCommentHelper(node, updatedComment);
  }

  static addDanglingComment(node, comment) {
    const updatedComment = {
      ...comment,
      leading: false,
      trailing: false
    };
    Util.addCommentHelper(node, updatedComment);
  }

  static addTrailingComment(node, comment) {
    const updatedComment = {
      ...comment,
      leading: false,
      trailing: true
    };
    Util.addCommentHelper(node, updatedComment);
  }
}


