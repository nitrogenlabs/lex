import {ParserError} from '../../common/errors/ParserError';

export class ParserGlimmer {
  static removeEmptyNodes(node) {
    return (
      node.type !== 'TextNode' ||
      (node.type === 'TextNode' &&
        node.chars.replace(/^\s+/, '').replace(/\s+$/, '') !== '')
    );
  }

  static removeWhiteSpace() {
    return {
      visitor: {
        Program(node) {
          node.body = node.body.filter(ParserGlimmer.removeEmptyNodes);
        },
        ElementNode(node) {
          node.children = node.children.filter(ParserGlimmer.removeEmptyNodes);
        }
      }
    };
  }

  static parse(text) {
    try {
      const glimmer = require('@glimmer/syntax').preprocess;
      return glimmer(text, {
        plugins: {
          ast: [ParserGlimmer.removeWhiteSpace]
        }
      });
      /* istanbul ignore next */
    } catch(error) {
      const matches = error.message.match(/on line (\d+)/);
      if(matches) {
        throw new ParserError(error.message, {
          end: {line: +matches[1], column: 80},
          start: {line: +matches[1], column: 0}
        });
      } else {
        throw error;
      }
    }
  }
}
