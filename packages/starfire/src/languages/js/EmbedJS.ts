import {Util} from '../../common/Util';
import {DocBuilders} from '../../doc/DocBuilders';
import {DocUtils} from '../../doc/DocUtils';

export class EmbedJS {
  static embed(path, print, textToDoc) {
    const node = path.getValue();
    const parent = path.getParentNode();
    const parentParent = path.getParentNode(1);
    const printMarkdown = (text) => {
      const doc = textToDoc(text, {parser: 'markdown', __inJsTemplate: true});
      return DocUtils.stripTrailingHardline(EmbedJS.escapeBackticks(doc));
    };

    switch(node.type) {
      case 'TemplateLiteral': {
        const isCss = [EmbedJS.isStyledJsx, EmbedJS.isStyledComponents, EmbedJS.isCssProp].some((isIt) => isIt(path));

        if(isCss) {
          // Get full template literal with expressions replaced by placeholders
          const rawQuasis = node.quasis.map((q) => q.value.raw);
          const text = rawQuasis.join('@starfire-placeholder');
          const doc = textToDoc(text, {parser: 'css'});
          return EmbedJS.transformCssDoc(doc, path, print);
        }

        /*
         * react-relay and graphql-tag
         * graphql`...`
         * graphql.experimental`...`
         * gql`...`
         *
         * This intentionally excludes Relay Classic tags, as Starfire does not
         * support Relay Classic formatting.
         */
        if(
          parent &&
          ((parent.type === 'TaggedTemplateExpression' &&
            ((parent.tag.type === 'MemberExpression' &&
              parent.tag.object.name === 'graphql' &&
              parent.tag.property.name === 'experimental') ||
              (parent.tag.type === 'Identifier' &&
                (parent.tag.name === 'gql' || parent.tag.name === 'graphql')))) ||
            (parent.type === 'CallExpression' &&
              parent.callee.type === 'Identifier' &&
              parent.callee.name === 'graphql'))
        ) {
          const expressionDocs = node.expressions ? path.map(print, 'expressions') : [];
          const numQuasis = node.quasis.length;

          if(numQuasis === 1 && node.quasis[0].value.raw.trim() === '') {
            return '``';
          }

          const parts = [];

          for(let i = 0; i < numQuasis; i++) {
            const templateElement = node.quasis[i];
            const isFirst = i === 0;
            const isLast = i === numQuasis - 1;
            const text = templateElement.value.raw;
            const lines = text.split('\n');
            const numLines = lines.length;
            const expressionDoc = expressionDocs[i];
            const startsWithBlankLine = numLines > 2 && lines[0].trim() === '' && lines[1].trim() === '';
            const endsWithBlankLine = numLines > 2 && lines[numLines - 1].trim() === ''
              && lines[numLines - 2].trim() === '';
            const commentsAndWhitespaceOnly = lines.every((line) => /^\s*(?:#[^\r\n]*)?$/.test(line));

            // Bail out if an interpolation occurs within a comment.
            if(!isLast && /#[^\r\n]*$/.test(lines[numLines - 1])) {
              return null;
            }

            let doc = null;

            if(commentsAndWhitespaceOnly) {
              doc = EmbedJS.printGraphqlComments(lines);
            } else {
              try {
                doc = DocUtils.stripTrailingHardline(
                  textToDoc(text, {parser: 'graphql'})
                );
              } catch(error) {
                // Bail if any part fails to parse.
                return null;
              }
            }

            if(doc) {
              if(!isFirst && startsWithBlankLine) {
                parts.push('');
              }
              parts.push(doc);
              if(!isLast && endsWithBlankLine) {
                parts.push('');
              }
            } else if(!isFirst && !isLast && startsWithBlankLine) {
              parts.push('');
            }

            if(expressionDoc) {
              parts.push(DocBuilders.concat(['$' + '{', expressionDoc, '}']));
            }
          }

          return DocBuilders.concat([
            '`',
            DocBuilders.indent(DocBuilders.concat([
              DocBuilders.hardline,
              DocBuilders.join(DocBuilders.hardline, parts)
            ])),
            DocBuilders.hardline,
            '`'
          ]);
        }

        break;
      }

      case 'TemplateElement': {
        /**
         * md`...`
         * markdown`...`
         */
        if(
          parentParent &&
          (parentParent.type === 'TaggedTemplateExpression' &&
            parent.quasis.length === 1 &&
            (parentParent.tag.type === 'Identifier' &&
              (parentParent.tag.name === 'md' ||
                parentParent.tag.name === 'markdown')))
        ) {
          const text = parent.quasis[0].value.cooked;
          const indentation = EmbedJS.getIndentation(text);
          const hasIndent = indentation !== '';
          return DocBuilders.concat([
            hasIndent
              ? DocBuilders.indent(
                DocBuilders.concat([
                  DocBuilders.softline,
                  printMarkdown(text.replace(new RegExp(`^${indentation}`, 'gm'), ''))
                ])
              )
              : DocBuilders.concat([DocBuilders.literalline, DocBuilders.dedentToRoot(printMarkdown(text))]),
            DocBuilders.softline
          ]);
        }

        break;
      }
      default:
        break;
    }
  }

  static getIndentation(str) {
    const firstMatchedIndent = str.match(/^([^\S\n]*)\S/m);
    return firstMatchedIndent === null ? '' : firstMatchedIndent[1];
  }

  static escapeBackticks(doc) {
    return Util.mapDoc(doc, (currentDoc) => {
      if(!currentDoc.parts) {
        return currentDoc;
      }

      const parts = [];

      currentDoc.parts.forEach((part) => {
        if(typeof part === 'string') {
          parts.push(part.replace(/`/g, '\\`'));
        } else {
          parts.push(part);
        }
      });

      return {...currentDoc, parts};
    });
  }

  static transformCssDoc(quasisDoc, path, print) {
    const parentNode = path.getValue();

    const isEmpty =
      parentNode.quasis.length === 1 && !parentNode.quasis[0].value.raw.trim();
    if(isEmpty) {
      return '``';
    }

    const expressionDocs = parentNode.expressions
      ? path.map(print, 'expressions')
      : [];
    const newDoc = EmbedJS.replacePlaceholders(quasisDoc, expressionDocs);
    /* istanbul ignore if */
    if(!newDoc) {
      throw new Error('Couldn\'t insert all the expressions');
    }
    return DocBuilders.concat([
      '`',
      DocBuilders.indent(DocBuilders.concat([DocBuilders.hardline, DocUtils.stripTrailingHardline(newDoc)])),
      DocBuilders.softline,
      '`'
    ]);
  }

  // Search all the placeholders in the quasisDoc tree
  // and replace them with the expression docs one by one
  // returns a new doc with all the placeholders replaced,
  // or null if it couldn't replace any expression
  static replacePlaceholders(quasisDoc, expressionDocs) {
    if(!expressionDocs || !expressionDocs.length) {
      return quasisDoc;
    }

    const expressions = expressionDocs.slice();
    const newDoc = DocUtils.mapDoc(quasisDoc, (doc) => {
      if(!doc || !doc.parts || !doc.parts.length) {
        return doc;
      }
      let {parts} = doc;
      const atIndex = parts.indexOf('@');
      const placeholderIndex = atIndex + 1;
      if(
        atIndex > -1 &&
        typeof parts[placeholderIndex] === 'string' &&
        parts[placeholderIndex].startsWith('starfire-placeholder')
      ) {
        // If placeholder is split, join it
        const at = parts[atIndex];
        const placeholder = parts[placeholderIndex];
        const rest = parts.slice(placeholderIndex + 1);
        parts = parts
          .slice(0, atIndex)
          .concat([at + placeholder])
          .concat(rest);
      }
      const atPlaceholderIndex = parts.findIndex(
        (part) =>
          typeof part === 'string' && part.startsWith('@starfire-placeholder')
      );
      if(atPlaceholderIndex > -1) {
        const placeholder = parts[atPlaceholderIndex];
        const rest = parts.slice(atPlaceholderIndex + 1);

        // When the expression has a suffix appended, like:
        // animation: linear ${time}s ease-out;
        const suffix = placeholder.slice('@starfire-placeholder'.length);

        const expression = expressions.shift();
        parts = parts
          .slice(0, atPlaceholderIndex)
          .concat(['$' + '{', expression, `}${suffix}`])
          .concat(rest);
      }
      return {
        ...doc,
        parts
      };
    });

    return expressions.length === 0 ? newDoc : null;
  }

  static printGraphqlComments(lines) {
    const parts = [];
    let seenComment = false;

    lines.map((textLine) => textLine.trim()).forEach((textLine, i, array) => {
      // Lines are either whitespace only, or a comment (with potential whitespace
      // around it). Drop whitespace-only lines.
      if(textLine === '') {
        return;
      }

      if(array[i - 1] === '' && seenComment) {
        // If a non-first comment is preceded by a blank (whitespace only) line,
        // add in a blank line.
        parts.push(DocBuilders.concat([DocBuilders.hardline, textLine]));
      } else {
        parts.push(textLine);
      }

      seenComment = true;
    });

    // If `lines` was whitespace only, return `null`.
    return parts.length === 0 ? null : DocBuilders.join(DocBuilders.hardline, parts);
  }

  /**
   * Template literal in this context:
   * <style jsx>{`div{color:red}`}</style>
   */
  static isStyledJsx(path) {
    const node = path.getValue();
    const parent = path.getParentNode();
    const parentParent = path.getParentNode(1);
    return (
      parentParent &&
      node.quasis &&
      parent.type === 'JSXExpressionContainer' &&
      parentParent.type === 'JSXElement' &&
      parentParent.openingElement.name.name === 'style' &&
      parentParent.openingElement.attributes.some(
        (attribute) => attribute.name.name === 'jsx'
      )
    );
  }

  /**
   * styled-components template literals
   */
  static isStyledComponents(path) {
    const parent = path.getParentNode();

    if(!parent || parent.type !== 'TaggedTemplateExpression') {
      return false;
    }

    const {tag} = parent;

    switch(tag.type) {
      case 'MemberExpression':
        return (
          // styled.foo``
          EmbedJS.isStyledIdentifier(tag.object) ||
          // Component.extend``
          (/^[A-Z]/.test(tag.object.name) && tag.property.name === 'extend')
        );

      case 'CallExpression':
        return (
          // styled(Component)``
          EmbedJS.isStyledIdentifier(tag.callee) ||
          (tag.callee.type === 'MemberExpression' &&
            // styled.foo.attr({})``
            ((tag.callee.object.type === 'MemberExpression' &&
              EmbedJS.isStyledIdentifier(tag.callee.object.object)) ||
              // styled(Component).attr({})``
              (tag.callee.object.type === 'CallExpression' &&
                EmbedJS.isStyledIdentifier(tag.callee.object.callee))))
        );

      case 'Identifier':
        // css``
        return tag.name === 'css';

      default:
        return false;
    }
  }

  /**
   * JSX element with CSS prop
   */
  static isCssProp(path) {
    const parent = path.getParentNode();
    const parentParent = path.getParentNode(1);
    return (
      parentParent &&
      parent.type === 'JSXExpressionContainer' &&
      parentParent.type === 'JSXAttribute' &&
      parentParent.name.type === 'JSXIdentifier' &&
      parentParent.name.name === 'css'
    );
  }

  static isStyledIdentifier(node) {
    return node.type === 'Identifier' && node.name === 'styled';
  }
}
