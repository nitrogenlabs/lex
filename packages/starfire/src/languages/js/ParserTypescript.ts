import {ParserError} from '../../common/errors/ParserError';
import {ParserIncludeShebang} from '../../common/ParserIncludeShebang';

export class ParserTypescript {
  static parse(text?, parsers?, opts?) {
    const jsx = ParserTypescript.isProbablyJsx(text);
    let ast;

    try {
      try {
        // Try passing with our best guess first.
        ast = ParserTypescript.tryParseTypeScript(text, jsx);
      } catch(e) {
        // But if we get it wrong, try the opposite.
        /* istanbul ignore next */
        ast = ParserTypescript.tryParseTypeScript(text, !jsx);
      }
    } catch(e) /* istanbul ignore next */ {
      if(typeof e.lineNumber === 'undefined') {
        throw e;
      }

      throw new ParserError(e.message, {start: {line: e.lineNumber, column: e.column + 1}});
    }

    delete ast.tokens;
    ParserIncludeShebang.includeShebang(text, ast);
    return ast;
  }

  static tryParseTypeScript(text, jsx) {
    const parser = require('typescript-eslint-parser');
    return parser.parse(text, {
      comment: true,
      ecmaFeatures: {jsx},
      loc: true,
      // Override logger function with noop,
      // to avoid unsupported version errors being logged
      loggerFn: () => {},
      range: true,
      tokens: true,
      useJSXTextNode: true
    });
  }

  /**
   * Use a naive regular expression to detect JSX
   */
  static isProbablyJsx(text) {
    return new RegExp(
      [
        '(^[^"\'`]*</)', // Contains "</" when probably not in a string
        '|',
        '(^[^/]{2}.*/>)' // Contains "/>" on line not starting with "//"
      ].join(''),
      'm'
    ).test(text);
  }
}
