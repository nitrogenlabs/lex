import {ParserError} from '../../common/errors/ParserError';

export class ParserBabylon {
  static parse(text, parsers, opts) {
    // Inline the require to avoid loading all the JS if we don't use it
    const babylon = require('babylon');
    const babylonOptions = {
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      plugins: [
        'jsx',
        'flow',
        'doExpressions',
        'objectRestSpread',
        'decorators',
        'classProperties',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'asyncGenerators',
        'functionBind',
        'functionSent',
        'dynamicImport',
        'numericSeparator',
        'importMeta',
        'optionalCatchBinding',
        'optionalChaining',
        'classPrivateProperties',
        'pipelineOperator',
        'nullishCoalescingOperator'
      ],
      sourceType: 'module'
    };

    const parseMethod = opts && opts.parser === 'json' ? 'parseExpression' : 'parse';
    let ast;

    try {
      ast = babylon[parseMethod](text, babylonOptions);
    } catch(originalError) {
      try {
        ast = babylon[parseMethod](text, {...babylonOptions, strictMode: false});
      } catch(nonStrictError) {
        throw new ParserError(
          // babel error prints (l:c) with cols that are zero indexed
          // so we need our custom error
          originalError.message.replace(/ \(.*\)/, ''),
          {start: {line: originalError.loc.line, column: originalError.loc.column + 1}}
        );
      }
    }

    delete ast.tokens;
    return ast;
  }
}
