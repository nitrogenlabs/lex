import escapeStringRegexp from 'escape-string-regexp';
import stringWidth from 'string-width';

import {FastPath} from './fastPath';
import {Comment, Node, Quote, QuoteType, SkipOptions} from './util.types';

// eslint-disable-next-line no-control-regex
export const notAsciiRegex = /[^\x20-\x7F]/;

export const isExportDeclaration = (node): boolean => {
  if(node) {
    switch(node.type) {
      case 'ExportDefaultDeclaration':
      case 'ExportDefaultSpecifier':
      case 'DeclareExportDeclaration':
      case 'ExportNamedDeclaration':
      case 'ExportAllDeclaration':
        return true;
    }
  }

  return false;
};

export const getParentExportDeclaration = (path: FastPath) => {
  const parentNode: Node = path.getParentNode();

  if(path.getName() === 'declaration' && isExportDeclaration(parentNode)) {
    return parentNode;
  }

  return null;
};

export const getPenultimate = (arr) => {
  if(arr.length > 1) {
    return arr[arr.length - 2];
  }

  return null;
};

export const skip = (chars: string | RegExp) =>
  (text: string, index: number, opts?: SkipOptions): number => {
    const backwards = opts && opts.backwards;

    // Allow `skip` functions to be threaded together without having
    // to check for failures (did someone say monads?).
    if(index === null) {
      return null;
    }

    const {length} = text;
    let cursor: number = index;

    while(cursor >= 0 && cursor < length) {
      const c = text.charAt(cursor);
      if(chars instanceof RegExp) {
        if(!chars.test(c)) {
          return cursor;
        }
      } else if(chars.indexOf(c) === -1) {
        return cursor;
      }

      if(backwards) {
        cursor = cursor - 1;
      } else {
        cursor = cursor + 1;
      }
    }

    if(cursor === -1 || cursor === length) {
      // If we reached the beginning or end of the file, return the
      // out-of-bounds cursor. It's up to the caller to handle this
      // correctly. We don't want to indicate `null` though if it
      // actually skipped valid characters.
      return cursor;
    }

    return null;
  };

export const skipWhitespace = skip(/\s/);
export const skipSpaces = skip(' \t');
export const skipToLineEnd = skip(',; \t');
export const skipEverythingButNewLine = skip(/[^\r\n]/);

export const skipInlineComment = (text: string, index: number): number => {
  if(index === null) {
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
};

export const skipTrailingComment = (text: string, index: number): number => {
  if(index === null) {
    return null;
  }

  if(text.charAt(index) === '/' && text.charAt(index + 1) === '/') {
    return skipEverythingButNewLine(text, index);
  }

  return index;
};

// This one doesn't use the above helper function because it wants to
// test \r\n in order and `skip` doesn't support ordering and we only
// want to skip one newline. It's simple to implement.
export const skipNewline = (text: string, index: number, opts?: SkipOptions): number => {
  const backwards = opts && opts.backwards;

  if(index === null) {
    return null;
  }

  const atIndex = text.charAt(index);
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
    if(
      atIndex === '\n' ||
      atIndex === '\r' ||
      atIndex === '\u2028' ||
      atIndex === '\u2029'
    ) {
      return index + 1;
    }
  }

  return index;
};

export const hasNewline = (text: string, index: number, opts: SkipOptions = {}): boolean => {
  const idx = skipSpaces(text, opts.backwards ? index - 1 : index, opts);
  const idx2 = skipNewline(text, idx, opts);
  return idx !== idx2;
};

export const hasNewlineInRange = (text: string, start: number, end: number): boolean => {
  for(let i = start; i < end; ++i) {
    if(text.charAt(i) === '\n') {
      return true;
    }
  }

  return false;
};

// Note: this function doesn't ignore leading comments unlike isNextLineEmpty
export const isPreviousLineEmpty = (text: string, node: Node, locStart: (node: Node) => number): boolean => {
  let idx: number = locStart(node) - 1;
  idx = skipSpaces(text, idx, {backwards: true});
  idx = skipNewline(text, idx, {backwards: true});
  idx = skipSpaces(text, idx, {backwards: true});
  const idx2 = skipNewline(text, idx, {backwards: true});
  return idx !== idx2;
};

export const isNextLineEmptyAfterIndex = (text: string, index: number): boolean => {
  let oldIdx: number = null;
  let idx: number = index;

  while(idx !== oldIdx) {
    // We need to skip all the potential trailing inline comments
    oldIdx = idx;
    idx = skipToLineEnd(text, idx);
    idx = skipInlineComment(text, idx);
    idx = skipSpaces(text, idx);
  }

  idx = skipTrailingComment(text, idx);
  idx = skipNewline(text, idx);
  return idx !== null && hasNewline(text, idx);
};

export const isNextLineEmpty = (text: string, node: Node, locEnd: (node: Node) => number): boolean =>
  isNextLineEmptyAfterIndex(text, locEnd(node));

export const getNextNonSpaceNonCommentCharacterIndexWithStartIndex = (text: string, idx: number): number => {
  let oldIdx: number = null;
  let nextIdx: number = idx;

  while(nextIdx !== oldIdx) {
    oldIdx = nextIdx;
    nextIdx = skipSpaces(text, nextIdx);
    nextIdx = skipInlineComment(text, nextIdx);
    nextIdx = skipTrailingComment(text, nextIdx);
    nextIdx = skipNewline(text, nextIdx);
  }
  return nextIdx;
};

export const getNextNonSpaceNonCommentCharacterIndex = (text: string, node: Node, locEnd: (node: Node) => number) =>
  getNextNonSpaceNonCommentCharacterIndexWithStartIndex(text, locEnd(node));

export const getNextNonSpaceNonCommentCharacter = (text: string, node: Node, locEnd: (node: Node) => number) =>
  text.charAt(getNextNonSpaceNonCommentCharacterIndex(text, node, locEnd));

export const hasSpaces = (text: string, index: number, opts: SkipOptions = {}) => {
  const {backwards} = opts;
  const idx = skipSpaces(text, backwards ? index - 1 : index, opts);
  return idx !== index;
};

// TODO: Make sure all setLocStart return a Node instead of mutate
export const setLocStart = (node: Node, index: number): Node => {
  const {range} = node;

  if(node.range) {
    range[0] = index;
    return {range, ...node};
  }

  return {range, start: index, ...node};
};

// TODO: Make sure all setLocEnd return a Node instead of mutate
export const setLocEnd = (node: Node, index: number): Node => {
  const {range} = node;

  if(node.range) {
    range[1] = index;
    return {range, ...node};
  }

  return {range, end: index, ...node};
};

export const PRECEDENCE = [
  ['|>'],
  ['??'],
  ['||'],
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
].reduce((precedence, tier, index: number) => {
  tier.forEach((op: string) => {
    precedence[op] = index;
  });

  return precedence;
}, {});

export const getPrecedence = (op) => PRECEDENCE[op];

export const equalityOperators = {
  '==': true,
  '!=': true,
  '===': true,
  '!==': true
};

export const multiplicativeOperators = {
  '*': true,
  '/': true,
  '%': true
};

export const bitshiftOperators = {
  '>>': true,
  '>>>': true,
  '<<': true
};

export const shouldFlatten = (parentOp, nodeOp) => {
  if(getPrecedence(nodeOp) !== getPrecedence(parentOp)) {
    return false;
  }

  // ** is right-associative
  // x ** y ** z --> x ** (y ** z)
  if(parentOp === '**') {
    return false;
  }

  // x == y == z --> (x == y) == z
  if(equalityOperators[parentOp] && equalityOperators[nodeOp]) {
    return false;
  }

  // x * y % z --> (x * y) % z
  if(
    (nodeOp === '%' && multiplicativeOperators[parentOp]) ||
    (parentOp === '%' && multiplicativeOperators[nodeOp])
  ) {
    return false;
  }

  // x * y / z --> (x * y) / z
  // x / y * z --> (x / y) * z
  if(
    nodeOp !== parentOp &&
    multiplicativeOperators[nodeOp] &&
    multiplicativeOperators[parentOp]
  ) {
    return false;
  }

  // x << y << z --> (x << y) << z
  if(bitshiftOperators[parentOp] && bitshiftOperators[nodeOp]) {
    return false;
  }

  return true;
};

export const isBitwiseOperator = (operator) => (
  !!bitshiftOperators[operator] ||
  operator === '|' ||
  operator === '^' ||
  operator === '&'
);

export const getLeftMost = (node: Node): Node => {
  const {left} = node;

  if(left) {
    return getLeftMost(left);
  }

  return node;
};

// Tests if an expression starts with `{`, or (if forbidFunctionClassAndDoExpr
// holds) `function`, `class`, or `do {}`. Will be overzealous if there's
// already necessary grouping parentheses.
export const startsWithNoLookaheadToken = (node: Node, forbidFunctionClassAndDoExpr) => {
  const {
    argument: nodeArgument,
    callee: nodeCallee,
    expression: nodeExpression,
    expressions: nodeExpressions,
    object: nodeObject,
    prefix: nodePrefix,
    tag: nodeTag,
    test: nodeTest,
    type: nodeType
  } = getLeftMost(node);

  switch(nodeType) {
    case 'FunctionExpression':
    case 'ClassExpression':
    case 'DoExpression':
      return forbidFunctionClassAndDoExpr;
    case 'ObjectExpression':
      return true;
    case 'MemberExpression':
    case 'OptionalMemberExpression':
      return startsWithNoLookaheadToken(nodeObject, forbidFunctionClassAndDoExpr);
    case 'TaggedTemplateExpression':
      if(nodeTag.type === 'FunctionExpression') {
        // IIFEs are always already parenthesized
        return false;
      }

      return startsWithNoLookaheadToken(nodeTag, forbidFunctionClassAndDoExpr);
    case 'CallExpression':
    case 'OptionalCallExpression':
      if(nodeCallee.type === 'FunctionExpression') {
        // IIFEs are always already parenthesized
        return false;
      }
      return startsWithNoLookaheadToken(nodeCallee, forbidFunctionClassAndDoExpr);
    case 'ConditionalExpression':
      return startsWithNoLookaheadToken(nodeTest, forbidFunctionClassAndDoExpr);
    case 'UpdateExpression':
      return (!nodePrefix && startsWithNoLookaheadToken(nodeArgument, forbidFunctionClassAndDoExpr));
    case 'BindExpression':
      return (nodeObject && startsWithNoLookaheadToken(nodeObject, forbidFunctionClassAndDoExpr));
    case 'SequenceExpression':
      return startsWithNoLookaheadToken(nodeExpressions[0], forbidFunctionClassAndDoExpr);
    case 'TSAsExpression':
      return startsWithNoLookaheadToken(nodeExpression, forbidFunctionClassAndDoExpr);
    default:
      return false;
  }
};

export const getAlignmentSize = (value: string, tabWidth: number, startIndex: number = 0): number => {
  let size: number = 0;

  for(let i = startIndex; i < value.length; ++i) {
    if(value[i] === '\t') {
      // Tabs behave in a way that they are aligned to the nearest
      // multiple of tabWidth:
      // 0 -> 4, 1 -> 4, 2 -> 4, 3 -> 4
      // 4 -> 8, 5 -> 8, 6 -> 8, 7 -> 8 ...
      size = size + tabWidth - (size % tabWidth);
    } else {
      size = size + 1;
    }
  }

  return size;
};

export const getIndentSize = (value: string, tabWidth: number): number => {
  const lastNewlineIndex: number = value.lastIndexOf('\n');

  if(lastNewlineIndex === -1) {
    return 0;
  }

  return getAlignmentSize(
    // All the leading whitespaces
    value.slice(lastNewlineIndex + 1).match(/^[ \t]*/)[0],
    tabWidth
  );
};

export const getPreferredQuote = (raw: string, preferredQuote: Quote): Quote => {
  // `rawContent` is the string exactly like it appeared in the input source
  // code, without its enclosing quotes.
  const rawContent: string = raw.slice(1, -1);
  const double: QuoteType = {quote: '"', regex: /"/g};
  const single: QuoteType = {quote: '\'', regex: /'/g};
  const preferred: QuoteType = preferredQuote === '\'' ? single : double;
  const alternate: QuoteType = preferred === single ? double : single;

  let result: Quote = preferred.quote;

  // If `rawContent` contains at least one of the quote preferred for enclosing
  // the string, we might want to enclose with the alternate quote instead, to
  // minimize the number of escaped quotes.
  if(rawContent.includes(preferred.quote) || rawContent.includes(alternate.quote)) {
    const numPreferredQuotes = (rawContent.match(preferred.regex) || []).length;
    const numAlternateQuotes = (rawContent.match(alternate.regex) || []).length;

    result = numPreferredQuotes > numAlternateQuotes ? alternate.quote : preferred.quote;
  }

  return result;
};

export const makeString = (rawContent: string, enclosingQuote: Quote, unescapeUnnecessaryEscapes: boolean): string => {
  const otherQuote: Quote = enclosingQuote === '"' ? '\'' : '"';

  // Matches _any_ escape and unescaped quotes (both single and double).
  const regex: RegExp = /\\([\s\S])|(['"])/g;

  // Escape and unescape single and double quotes as needed to be able to
  // enclose `rawContent` with `enclosingQuote`.
  const newContent: string = rawContent.replace(regex, (match, escaped, quote) => {
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
    return unescapeUnnecessaryEscapes &&
      /^[^\\nrvtbfux\r\n\u2028\u2029"'0-7]$/.test(escaped)
      ? escaped
      : `\\${escaped}`;
  });

  return enclosingQuote + newContent + enclosingQuote;
};

export const printString = (raw: string, options: any, isDirectiveLiteral: boolean) => {
  // `rawContent` is the string exactly like it appeared in the input source
  // code, without its enclosing quotes.
  const rawContent: string = raw.slice(1, -1);

  // Check for the alternate quote, to determine if we're allowed to swap
  // the quotes on a DirectiveLiteral.
  const canChangeDirectiveQuotes: boolean = !rawContent.includes('"') && !rawContent.includes('\'');

  /** @type {Quote} */
  const enclosingQuote: Quote =
    options.parser === 'json'
      ? '"'
      : options.__isInHtmlAttribute
        ? '\''
        : getPreferredQuote(raw, options.singleQuote ? '\'' : '"');

  // Directives are exact code unit sequences, which means that you can't
  // change the escape sequences they use.
  // See https://github.com/prettier/prettier/issues/1555
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
  return makeString(
    rawContent,
    enclosingQuote,
    !(
      options.parser === 'css' ||
      options.parser === 'less' ||
      options.parser === 'scss' ||
      options.embeddedInHtml
    )
  );
};

export const printNumber = (rawNumber: string): string => (
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

export const getMaxContinuousCount = (str: string, target: string): number => {
  const results = str.match(new RegExp(`(${escapeStringRegexp(target)})+`, 'g'));

  if(results === null) {
    return 0;
  }

  return results.reduce((maxCount, result) => Math.max(maxCount, result.length / target.length), 0);
};

export const getMinNotPresentContinuousCount = (str: string, target: string): number => {
  const matches = str.match(new RegExp(`(${escapeStringRegexp(target)})+`, 'g'));

  if(matches === null) {
    return 0;
  }

  const countPresent = new Map();
  let max: number = 0;

  for(const match of matches) {
    const count = match.length / target.length;
    countPresent.set(count, true);
    if(count > max) {
      max = count;
    }
  }

  for(let i = 1; i < max; i++) {
    if(!countPresent.get(i)) {
      return i;
    }
  }

  return max + 1;
};

export const getStringWidth = (text: string): number => {
  if(!text) {
    return 0;
  }

  // shortcut to avoid needless string `RegExp`s, replacements, and allocations within `string-width`
  if(!notAsciiRegex.test(text)) {
    return text.length;
  }

  return stringWidth(text);
};

export const hasNodeIgnoreComment = (node: Node): boolean => (
  node &&
  node.comments &&
  node.comments.length > 0 &&
  node.comments.some((comment: Comment) => comment.value.trim() === 'starfire-ignore')
);

export const hasIgnoreComment = (path: FastPath): boolean => {
  const node: Node = path.getValue();
  return hasNodeIgnoreComment(node);
};

export const matchAncestorTypes = (path: FastPath, types, index = 0) => {
  const updatedTypes = types.slice();
  let updatedIndex: number = index;

  while(updatedTypes.length) {
    const parent = path.getParentNode(updatedIndex);
    const type = updatedTypes.shift();

    if(!parent || parent.type !== type) {
      return false;
    }

    updatedIndex = updatedIndex + 1;
  }

  return true;
};

// TODO: make sure addCommentHelper returns a Node instead of mutate
export const addCommentHelper = (node: Node, comment: Comment): Node => {
  const {comments = []} = node;
  comments.push(comment);

  // For some reason, TypeScript parses `// x` inside of JSXText as a comment
  // We already "print" it via the raw text, we don't need to re-print it as a
  // comment
  if(node.type === 'JSXText') {
    return {...node, comments, printed: true};
  }

  return {...node, comments, printed: false};
};

// TODO: make sure addLeadingComment returns a Node instead of mutate
export const addLeadingComment = (node: Node, comment: Comment) =>
  addCommentHelper(node, {...comment, leading: true, trailing: false});

// TODO: make sure addDanglingComment returns a Node instead of mutate
export const addDanglingComment = (node: Node, comment: Comment) =>
  addCommentHelper(node, {...comment, leading: false, trailing: false});

// TODO: make sure addTrailingComment returns a Node instead of mutate
export const addTrailingComment = (node: Node, comment: Comment) =>
  addCommentHelper(node, {...comment, leading: false, trailing: true});

export const isWithinParentArrayProperty = (path: FastPath, propertyName: string): boolean => {
  const node: Node = path.getValue();
  const parent: Node = path.getParentNode();

  if(parent === null) {
    return false;
  }

  if(!Array.isArray(parent[propertyName])) {
    return false;
  }

  const key: string = path.getName();
  return parent[propertyName][key] === node;
};

export const replaceEndOfLineWith = (text: string, replacement: string) => {
  const parts: string[] = [];

  for(const part of text.split('\n')) {
    if(parts.length !== 0) {
      parts.push(replacement);
    }
    parts.push(part);
  }

  return parts;
};
