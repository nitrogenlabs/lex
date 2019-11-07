import {ParserError} from '../../common/errors/ParserError';

export class ParserGraphql {
  static parseComments(ast) {
    const comments = [];
    const {startToken} = ast.loc;
    let {next} = startToken;
    while(next.kind !== '<EOF>') {
      if(next.kind === 'Comment') {
        Object.assign(next, {
          // The Comment token's column starts _after_ the `#`,
          // but we need to make sure the node captures the `#`
          column: next.column - 1
        });
        comments.push(next);
      }
      next = next.next;
    }

    return comments;
  }

  static removeTokens(node) {
    if(node && typeof node === 'object') {
      delete node.startToken;
      delete node.endToken;
      delete node.prev;
      delete node.next;

      Object.keys(node).forEach((key) => {
        ParserGraphql.removeTokens(node[key]);
      });
    }
    return node;
  }

  static parse(text /* , parsers, opts*/) {
    // Inline the require to avoid loading all the JS if we don't use it
    const parser = require('graphql/language');
    try {
      const ast = parser.parse(text);
      ast.comments = ParserGraphql.parseComments(ast);
      ParserGraphql.removeTokens(ast);
      return ast;
    } catch(error) {
      const {GraphQLError} = require('graphql/error');
      if(error instanceof GraphQLError) {
        throw new ParserError(error.message, {
          start: {
            column: error.locations[0].column,
            line: error.locations[0].line
          }
        });
      } else {
        throw error;
      }
    }
  }
}
