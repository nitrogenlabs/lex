import {Util} from '../../common/Util';
import {DocBuilders} from '../../doc/DocBuilders';
import {DocPrinter} from '../../doc/DocPrinter';

const {align, concat, fill, group, hardline, join, line, softline} = DocBuilders;

export class PrinterMarkdown {
  static SINGLE_LINE_NODE_TYPES = ['heading', 'tableCell', 'link'];
  static SIBLING_NODE_TYPES = ['listItem', 'definition', 'footnoteDefinition'];
  static INLINE_NODE_TYPES = [
    'inlineCode',
    'emphasis',
    'strong',
    'delete',
    'link',
    'linkReference',
    'image',
    'imageReference',
    'footnote',
    'footnoteReference',
    'sentence',
    'whitespace',
    'word',
    'break'
  ];
  static get INLINE_NODE_WRAPPER_TYPES() {
    return PrinterMarkdown.INLINE_NODE_TYPES.concat([
      'tableCell',
      'paragraph',
      'heading'
    ]);
  }
  static print = PrinterMarkdown.genericPrint;
  static massageAstNode = PrinterMarkdown.clean;
  static hasPrettierIgnore = Util.hasIgnoreComment;

  static genericPrint(path, options, print) {
    const node = path.getValue();

    if(PrinterMarkdown.shouldRemainTheSameContent(path)) {
      return concat(
        Util
          .splitText(
            options.originalText.slice(
              node.position.start.offset,
              node.position.end.offset
            )
          )
          .map((splitTextNode) => {
            const {type, value} = splitTextNode;

            if(type === 'word') {
              return value;
            }

            return value === '' ? '' : PrinterMarkdown.printLine(path, value, options);
          })
      );
    }

    switch(node.type) {
      case 'root':
        return concat([
          PrinterMarkdown.normalizeDoc(PrinterMarkdown.printChildren(path, options, print)),
          hardline
        ]);
      case 'paragraph':
        return PrinterMarkdown.printChildren(path, options, print, {
          postprocessor: fill
        });
      case 'sentence':
        return PrinterMarkdown.printChildren(path, options, print);
      case 'word':
        return node.value
          .replace(/[*]/g, '\\*') // escape all `*`
          .replace(
            new RegExp(
              [
                `(^|[${Util.punctuationCharRange}])(_+)`,
                `(_+)([${Util.punctuationCharRange}]|$)`
              ].join('|'),
              'g'
            ),
            (_, text1, underscore1, underscore2, text2) => // eslint-disable-line
              (underscore1
                ? `${text1}${underscore1}`
                : `${underscore2}${text2}`
              ).replace(/_/g, '\\_')
          ); // escape all `_` except concating with non-punctuation, e.g. `1_2_3` is not considered emphasis
      case 'whitespace': {
        const parentNode = path.getParentNode();
        const index = parentNode.children.indexOf(node);
        const nextNode = parentNode.children[index + 1];

        const proseWrap =
          // leading char that may cause different syntax
          nextNode && /^>|^([-+*]|#{1,6}|[0-9]+[.)])$/.test(nextNode.value)
            ? 'never'
            : options.proseWrap;

        return PrinterMarkdown.printLine(path, node.value, {proseWrap});
      }
      case 'emphasis': {
        const parentNode = path.getParentNode();
        const index = parentNode.children.indexOf(node);
        const prevNode = parentNode.children[index - 1];
        const nextNode = parentNode.children[index + 1];
        const hasPrevOrNextWord = // `1*2*3` is considered emphais but `1_2_3` is not
          (prevNode &&
            prevNode.type === 'sentence' &&
            prevNode.children.length > 0 &&
            Util.getLast(prevNode.children).type === 'word' &&
            !Util.getLast(prevNode.children).hasTrailingPunctuation) ||
          (nextNode &&
            nextNode.type === 'sentence' &&
            nextNode.children.length > 0 &&
            nextNode.children[0].type === 'word' &&
            !nextNode.children[0].hasLeadingPunctuation);
        const style =
          hasPrevOrNextWord || PrinterMarkdown.getAncestorNode(path, 'emphasis') ? '*' : '_';
        return concat([style, PrinterMarkdown.printChildren(path, options, print), style]);
      }
      case 'strong':
        return concat(['**', PrinterMarkdown.printChildren(path, options, print), '**']);
      case 'delete':
        return concat(['~~', PrinterMarkdown.printChildren(path, options, print), '~~']);
      case 'inlineCode': {
        const backtickCount = Util.getMaxContinuousCount(node.value, '`');
        const style = backtickCount === 1 ? '``' : '`';
        const gap = backtickCount ? ' ' : '';
        return concat([style, gap, node.value, gap, style]);
      }
      case 'link':
        switch(options.originalText[node.position.start.offset]) {
          case '<':
            return concat(['<', node.url, '>']);
          case '[':
            return concat([
              '[',
              PrinterMarkdown.printChildren(path, options, print),
              '](',
              PrinterMarkdown.printUrl(node.url, ')'),
              PrinterMarkdown.printTitle(node.title, options),
              ')'
            ]);
          default:
            return options.originalText.slice(
              node.position.start.offset,
              node.position.end.offset
            );
        }
      case 'image':
        return concat([
          '![',
          node.alt || '',
          '](',
          PrinterMarkdown.printUrl(node.url, ')'),
          PrinterMarkdown.printTitle(node.title, options),
          ')'
        ]);
      case 'blockquote':
        return concat(['> ', align('> ', PrinterMarkdown.printChildren(path, options, print))]);
      case 'heading':
        return concat([
          `${'#'.repeat(node.depth)} `,
          PrinterMarkdown.printChildren(path, options, print)
        ]);
      case 'code': {
        if(
          // the first char may point to `\n`, e.g. `\n\t\tbar`, just ignore it
          /^\n?( {4,}|\t)/.test(
            options.originalText.slice(
              node.position.start.offset,
              node.position.end.offset
            )
          )
        ) {
          // indented code block
          const alignment = ' '.repeat(4);
          return align(
            alignment,
            concat([alignment, join(hardline, node.value.split('\n'))])
          );
        }

        // fenced code block
        const styleUnit = options.__inJsTemplate ? '~' : '`';
        const style = styleUnit.repeat(
          Math.max(
            3,
            Util.getMaxContinuousCount(node.value, styleUnit) + 1
          )
        );
        return concat([
          style,
          node.lang || '',
          hardline,
          join(hardline, node.value.split('\n')),
          hardline,
          style
        ]);
      }
      case 'yaml':
        return concat(['---', hardline, node.value, hardline, '---']);
      case 'toml':
        return concat(['+++', hardline, node.value, hardline, '+++']);
      case 'html': {
        const parentNode = path.getParentNode();
        return PrinterMarkdown.replaceNewlinesWithHardlines(
          parentNode.type === 'root' &&
            Util.getLast(parentNode.children) === node
            ? node.value.trimRight()
            : node.value
        );
      }
      case 'list': {
        const nthSiblingIndex = PrinterMarkdown.getNthListSiblingIndex(
          node,
          path.getParentNode()
        );

        const isGitDiffFriendlyOrderedList =
          node.ordered &&
          node.children.length > 1 &&
          /^\s*1(\.|\))/.test(
            options.originalText.slice(
              node.children[1].position.start.offset,
              node.children[1].position.end.offset
            )
          );

        return PrinterMarkdown.printChildren(path, options, print, {
          processor: (childPath, index) => {
            const {ordered, start} = node;

            const getPrefix = () => {
              let rawPrefix;

              if(ordered) {
                if(index === 0) {
                  rawPrefix = start;
                } else {
                  rawPrefix = (isGitDiffFriendlyOrderedList ? 1 : start + index)
                    + (nthSiblingIndex % 2 === 0 ? '. ' : ') ');
                }
              } else {
                rawPrefix = nthSiblingIndex % 2 === 0 ? '* ' : '- ';
              }

              // do not print trailing spaces for empty list item since it might be treated as `break` node
              // by [doc-printer](https://github.com/starfire/starfire/blob/1.10.2/src/doc/doc-printer.js#L395-L405),
              // we don't want to preserve unnecessary trailing spaces.
              const listItem = childPath.getValue();
              return listItem.children.length
                ? PrinterMarkdown.alignListPrefix(rawPrefix, options)
                : rawPrefix;
            };
            const prefix = getPrefix();
            return concat([
              prefix,
              align(
                ' '.repeat(prefix.length),
                PrinterMarkdown.printListItem(childPath, options, print, prefix)
              )
            ]);
          }
        });
      }
      case 'thematicBreak': {
        const counter = PrinterMarkdown.getAncestorCounter(path, 'list');
        if(counter === -1) {
          return '---';
        }
        const nthSiblingIndex = PrinterMarkdown.getNthListSiblingIndex(
          path.getParentNode(counter),
          path.getParentNode(counter + 1)
        );
        return nthSiblingIndex % 2 === 0 ? '---' : '***';
      }
      case 'linkReference': {
        const {identifier, referenceType} = node;
        let reference;

        if(referenceType === 'full') {
          reference = concat(['[', identifier, ']']);
        } else {
          reference = referenceType === 'collapsed' ? '[]' : '';
        }

        return concat([
          '[',
          PrinterMarkdown.printChildren(path, options, print),
          ']',
          reference
        ]);
      }
      case 'imageReference':
        switch(node.referenceType) {
          case 'full':
            return concat(['![', node.alt || '', '][', node.identifier, ']']);
          default:
            return concat([
              '![',
              node.alt,
              ']',
              node.referenceType === 'collapsed' ? '[]' : ''
            ]);
        }
      case 'definition':
        return concat([
          '[',
          node.identifier,
          ']: ',
          PrinterMarkdown.printUrl(node.url),
          PrinterMarkdown.printTitle(node.title, options)
        ]);
      case 'footnote':
        return concat(['[^', PrinterMarkdown.printChildren(path, options, print), ']']);
      case 'footnoteReference':
        return concat(['[^', node.identifier, ']']);
      case 'footnoteDefinition': {
        const nextNode = path.getParentNode().children[path.getName() + 1];
        return concat([
          '[^',
          node.identifier,
          ']: ',
          group(
            concat([
              align(
                ' '.repeat(options.tabWidth),
                PrinterMarkdown.printChildren(path, options, print, {
                  processor: (childPath, index) =>
                    (index === 0
                      ? group(concat([softline, softline, childPath.call(print)]))
                      : childPath.call(print))
                })
              ),
              nextNode && nextNode.type === 'footnoteDefinition' ? softline : ''
            ])
          )
        ]);
      }
      case 'table':
        return PrinterMarkdown.printTable(path, options, print);
      case 'tableCell':
        return PrinterMarkdown.printChildren(path, options, print);
      case 'break':
        return concat([
          /\s/.test(options.originalText[node.position.start.offset])
            ? '  '
            : '\\',
          hardline
        ]);
      case 'tableRow': // handled in "table"
      case 'listItem': // handled in "list"
      default:
        throw new Error(`Unknown markdown type ${JSON.stringify(node.type)}`);
    }
  }

  static printListItem(path, options, print, listPrefix) {
    const {checked} = path.getValue();
    let prefix = '';

    if(checked !== null) {
      prefix = checked ? '[x] ' : '[ ] ';
    }

    return concat([
      prefix,
      PrinterMarkdown.printChildren(path, options, print, {
        processor: (childPath, index) => {
          if(index === 0 && childPath.getValue().type !== 'list') {
            return align(' '.repeat(prefix.length), childPath.call(print));
          }

          const alignment = ' '.repeat(
            PrinterMarkdown.clamp(options.tabWidth - listPrefix.length, 0, 3) // 4+ will cause indented code block
          );
          return concat([alignment, align(alignment, childPath.call(print))]);
        }
      })
    ]);
  }

  static alignListPrefix(prefix, options) {
    const getAdditionalSpaces = () => {
      const restSpaces = prefix.length % options.tabWidth;
      return restSpaces === 0 ? 0 : options.tabWidth - restSpaces;
    };
    const additionalSpaces = getAdditionalSpaces();
    return (
      prefix +
      ' '.repeat(
        additionalSpaces >= 4 ? 0 : additionalSpaces // 4+ will cause indented code block
      )
    );
  }

  static getNthListSiblingIndex(node, parentNode) {
    return PrinterMarkdown.getNthSiblingIndex(
      node,
      parentNode,
      (siblingNode) => siblingNode.ordered === node.ordered
    );
  }

  static replaceNewlinesWithHardlines(str) {
    return join(hardline, str.split('\n'));
  }

  static getNthSiblingIndex(node, parentNode, condition) {
    const updatedCondition = condition || (() => true);

    let index: number = -1;

    for(const childNode of parentNode.children) {
      if(childNode.type === node.type && updatedCondition(childNode)) {
        index = index + 1;
      } else {
        index = -1;
      }

      if(childNode === node) {
        return index;
      }
    }

    return index;
  }

  static getAncestorCounter(path, typeOrTypes) {
    const types = [].concat(typeOrTypes);

    let counter = -1;
    let ancestorNode;

    while(ancestorNode = path.getParentNode(++counter)) { //eslint-disable-line
      if(types.indexOf(ancestorNode.type) !== -1) {
        return counter;
      }
    }

    return -1;
  }

  static getAncestorNode(path, typeOrTypes) {
    const counter = PrinterMarkdown.getAncestorCounter(path, typeOrTypes);
    return counter === -1 ? null : path.getParentNode(counter);
  }

  static printLine(path, value, options) {
    if(options.proseWrap === 'preserve' && value === '\n') {
      return hardline;
    }

    const isBreakable: boolean =
      options.proseWrap === 'always' &&
      !PrinterMarkdown.getAncestorNode(path, PrinterMarkdown.SINGLE_LINE_NODE_TYPES);

    if(value !== '') {
      return isBreakable ? line : ' ';
    }

    return isBreakable ? softline : '';
  }

  static printTable(path, options, print) {
    const node = path.getValue();
    const contents = []; // { [rowIndex: number]: { [columnIndex: number]: string } }

    path.forEach((rowPath) => {
      const rowContents = [];

      rowPath.forEach((cellPath) => {
        rowContents.push(
          DocPrinter.printDocToString(cellPath.call(print), options).formatted
        );
      }, 'children');

      contents.push(rowContents);
    }, 'children');

    const columnMaxWidths = contents.reduce(
      (currentWidths, rowContents) =>
        currentWidths.map((width, columnIndex) =>
          Math.max(width, Util.getStringWidth(rowContents[columnIndex]))
        ),
      contents[0].map(() => 3) // minimum width = 3 (---, :--, :-:, --:)
    );

    const printSeparator = () => concat([
      '| ',
      join(
        ' | ',
        columnMaxWidths.map((width, index) => {
          switch(node.align[index]) {
            case 'left':
              return `:${'-'.repeat(width - 1)}`;
            case 'right':
              return `${'-'.repeat(width - 1)}:`;
            case 'center':
              return `:${'-'.repeat(width - 2)}:`;
            default:
              return '-'.repeat(width);
          }
        })
      ),
      ' |'
    ]);

    const alignLeft = (text, width) => concat([text, ' '.repeat(width - Util.getStringWidth(text))]);

    const alignRight = (text, width) => concat([' '.repeat(width - Util.getStringWidth(text)), text]);

    const alignCenter = (text, width) => {
      const spaces = width - Util.getStringWidth(text);
      const left = Math.floor(spaces / 2);
      const right = spaces - left;
      return concat([' '.repeat(left), text, ' '.repeat(right)]);
    };

    const printRow = (rowContents) => concat([
      '| ',
      join(
        ' | ',
        rowContents.map((rowContent, columnIndex) => {
          switch(node.align[columnIndex]) {
            case 'right':
              return alignRight(rowContent, columnMaxWidths[columnIndex]);
            case 'center':
              return alignCenter(rowContent, columnMaxWidths[columnIndex]);
            default:
              return alignLeft(rowContent, columnMaxWidths[columnIndex]);
          }
        })
      ),
      ' |'
    ]);

    return join(hardline, [
      printRow(contents[0]),
      printSeparator(),
      join(hardline, contents.slice(1).map(printRow))
    ]);
  }

  static printChildren(path, options, print, events?) {
    const {
      postprocessor = concat,
      processor = ((childPath) => childPath.call(print))
    } = events || {};
    const node = path.getValue();
    const parts = [];

    let counter: number = 0;
    let lastChildNode;
    let starfireIgnore = false;

    path.forEach((childPath, index) => {
      const childNode = childPath.getValue();

      const result = starfireIgnore
        ? options.originalText.slice(
          childNode.position.start.offset,
          childNode.position.end.offset
        )
        : processor(childPath, index);

      starfireIgnore = false;

      if(result !== false) {
        starfireIgnore = PrinterMarkdown.isStarfireIgnore(childNode);
        counter = counter + 1;

        const data = {
          index: counter,
          options,
          parentNode: node,
          parts,
          prevNode: lastChildNode
        };

        if(!PrinterMarkdown.shouldNotPrePrintHardline(childNode, data)) {
          parts.push(hardline);

          if(
            PrinterMarkdown.shouldPrePrintDoubleHardline(childNode, data) ||
            PrinterMarkdown.shouldPrePrintTripleHardline(childNode, data)
          ) {
            parts.push(hardline);
          }

          if(PrinterMarkdown.shouldPrePrintTripleHardline(childNode, data)) {
            parts.push(hardline);
          }
        }

        parts.push(result);

        lastChildNode = childNode;
      }
    }, 'children');

    return postprocessor(parts);
  }

  static isStarfireIgnore(node) {
    return (
      node.type === 'html' && /^<!--\s*starfire-ignore\s*-->$/.test(node.value)
    );
  }

  static shouldNotPrePrintHardline(node, data) {
    const isFirstNode = data.parts.length === 0;
    const isInlineNode = PrinterMarkdown.INLINE_NODE_TYPES.indexOf(node.type) !== -1;

    const isInlineHTML =
      node.type === 'html' &&
      PrinterMarkdown.INLINE_NODE_WRAPPER_TYPES.indexOf(data.parentNode.type) !== -1;

    return isFirstNode || isInlineNode || isInlineHTML;
  }

  static shouldPrePrintDoubleHardline(node, data) {
    const isSequence = (data.prevNode && data.prevNode.type) === node.type;
    const isSiblingNode =
      isSequence && PrinterMarkdown.SIBLING_NODE_TYPES.indexOf(node.type) !== -1;

    const isInTightListItem =
      data.parentNode.type === 'listItem' && !data.parentNode.loose;

    const isPrevNodeLooseListItem =
      data.prevNode && data.prevNode.type === 'listItem' && data.prevNode.loose;

    const isPrevNodeStarfireIgnore = PrinterMarkdown.isStarfireIgnore(data.prevNode);

    return (
      isPrevNodeLooseListItem ||
      !(isSiblingNode || isInTightListItem || isPrevNodeStarfireIgnore)
    );
  }

  static shouldPrePrintTripleHardline(node, data) {
    const isPrevNodeList = data.prevNode && data.prevNode.type === 'list';
    const isIndentedCode =
      node.type === 'code' &&
      /\s/.test(data.options.originalText[node.position.start.offset]);

    return isPrevNodeList && isIndentedCode;
  }

  static shouldRemainTheSameContent(path) {
    const ancestorNode = PrinterMarkdown.getAncestorNode(path, [
      'linkReference',
      'imageReference'
    ]);

    return (
      ancestorNode &&
      (ancestorNode.type !== 'linkReference' ||
        ancestorNode.referenceType !== 'full')
    );
  }

  static normalizeDoc(doc) {
    return Util.mapDoc(doc, (currentDoc) => {
      if(!currentDoc.parts) {
        return currentDoc;
      }

      if(currentDoc.type === 'concat' && currentDoc.parts.length === 1) {
        return currentDoc.parts[0];
      }

      const parts = [];

      currentDoc.parts.forEach((part) => {
        if(part.type === 'concat') {
          parts.push.apply(parts, part.parts); // eslint-disable-line
        } else if(part !== '') {
          parts.push(part);
        }
      });

      return {
        ...currentDoc,
        parts: PrinterMarkdown.normalizeParts(parts)
      };
    });
  }

  static printUrl(url, dangerousCharOrChars?) {
    const dangerousChars = [' '].concat(dangerousCharOrChars || []);
    return new RegExp(dangerousChars.map((x) => `\\${x}`).join('|')).test(url)
      ? `<${url}>`
      : url;
  }

  static printTitle(title: string, options) {
    if(!title) {
      return '';
    }
    if(title.includes('"') && title.includes('\'') && !title.includes(')')) {
      return ` (${title})`; // avoid escaped quotes
    }
    // faster than using RegExps: https://jsperf.com/performance-of-match-vs-split
    const singleCount = title.split('\'').length - 1;
    const doubleCount = title.split('"').length - 1;
    let quote: string;

    if(singleCount > doubleCount) {
      quote = '"';
    } else if(doubleCount > singleCount) {
      quote = '\'';
    } else {
      quote = options.singleQuote ? '\'' : '"';
    }

    const updatedTitle: string = title.replace(new RegExp(`(${quote})`, 'g'), '\\$1');
    return ` ${quote}${updatedTitle}${quote}`;
  }

  static normalizeParts(parts) {
    return parts.reduce((current, part) => {
      const lastPart = Util.getLast(current);

      if(typeof lastPart === 'string' && typeof part === 'string') {
        current.splice(-1, 1, lastPart + part);
      } else {
        current.push(part);
      }

      return current;
    }, []);
  }

  static clamp(value, min, max) {
    if(value < min) {
      return min;
    }

    return value > max ? max : value;
  }

  static clean(ast, newObj) {
    // for markdown codeblock
    if(ast.type === 'code') {
      delete newObj.value;
    }
    // for markdown whitespace: "\n" and " " are considered the same
    if(ast.type === 'whitespace' && ast.value === '\n') {
      newObj.value = ' ';
    }
  }
}
