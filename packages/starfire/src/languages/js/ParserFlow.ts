import {ParserError} from '../../common/errors/ParserError';
import {ParserIncludeShebang} from '../../common/ParserIncludeShebang';

export class ParserFlow {
  static parse(text) {
    // Inline the require to avoid loading all the JS if we don't use it
    const flowParser = require('flow-parser');
    const ast = flowParser.parse(text, {
      esproposal_class_instance_fields: true,
      esproposal_class_static_fields: true,
      esproposal_export_star_as: true
    });

    if(ast.errors.length > 0) {
      const {loc} = ast.errors[0];

      throw new ParserError(ast.errors[0].message, {
        end: {line: loc.end.line, column: loc.end.column + 1},
        start: {line: loc.start.line, column: loc.start.column + 1}
      });
    }

    ParserIncludeShebang.includeShebang(text, ast);

    return ast;
  }
}
