import remarkFrontmatter from 'remark-frontmatter';
import remarkParse from 'remark-parse';
import unified from 'unified';

import {Util} from '../../common/Util';

/**
 * based on [MDAST](https://github.com/syntax-tree/mdast) with following modifications:
 *
 * 1. restore unescaped character (Text)
 * 2. merge continuous Texts
 * 3. replace whitespaces in InlineCode#value with one whitespace
 *    reference: http://spec.commonmark.org/0.25/#example-605
 * 4. split Text into Sentence
 *
 * interface Word { value: string }
 * interface Whitespace { value: string }
 * interface Sentence { children: Array<Word | Whitespace> }
 * interface InlineCode { children: Array<Sentence> }
 */

export class ParserMarkdown {
  static parse(text /* , parsers, opts*/) {
    const processor = unified()
      .use(remarkParse, {footnotes: true, commonmark: true})
      .use(remarkFrontmatter, ['yaml', 'toml'])
      .use(ParserMarkdown.restoreUnescapedCharacter(text))
      .use(ParserMarkdown.mergeContinuousTexts)
      .use(ParserMarkdown.transformInlineCode)
      .use(ParserMarkdown.splitText);
    return processor.runSync(processor.parse(text));
  }

  static map(ast, handler) {
    const preorder = (node, index: number, parentNode) => {
      const newNode = {...handler(node, index, parentNode)};

      if(newNode.children) {
        newNode.children = newNode.children.map((child, childIndex) => preorder(child, childIndex, newNode));
      }
      return newNode;
    };

    return preorder(ast, null, null);
  }

  static transformInlineCode() {
    return (ast) =>
      ParserMarkdown.map(ast, (node) => {
        if(node.type !== 'inlineCode') {
          return node;
        }

        return {
          ...node,
          value: node.value.replace(/\s+/g, ' ')
        };
      });
  }

  static restoreUnescapedCharacter(originalText) {
    return () => (ast) =>
      ParserMarkdown.map(ast, (node) => (node.type !== 'text'
        ? node
        : {
          ...node,
          value:
              node.value !== '*' &&
                node.value !== '_' && // handle these two cases in printer
                node.value.length === 1 &&
                node.position.end.offset - node.position.start.offset > 1
                ? originalText.slice(
                  node.position.start.offset,
                  node.position.end.offset
                )
                : node.value
        }));
  }

  static mergeContinuousTexts() {
    return (ast) =>
      ParserMarkdown.map(ast, (node) => {
        if(!node.children) {
          return node;
        }
        const children = node.children.reduce((current, child) => {
          const lastChild = current[current.length - 1];
          if(lastChild && lastChild.type === 'text' && child.type === 'text') {
            current.splice(-1, 1, {
              position: {
                end: child.position.end,
                start: lastChild.position.start
              },
              type: 'text',
              value: lastChild.value + child.value
            });
          } else {
            current.push(child);
          }
          return current;
        }, []);
        return {...node, children};
      });
  }

  static splitText() {
    return (ast) =>
      ParserMarkdown.map(ast, (node, index, parentNode) => {
        if(node.type !== 'text') {
          return node;
        }

        let {value} = node;

        if(parentNode.type === 'paragraph') {
          if(index === 0) {
            value = value.trimLeft();
          }
          if(index === parentNode.children.length - 1) {
            value = value.trimRight();
          }
        }

        return {
          children: Util.splitText(value),
          position: node.position,
          type: 'sentence'
        };
      });
  }
}
