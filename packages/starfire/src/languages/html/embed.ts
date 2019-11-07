import {Util} from '../../common/Util';
import {DocBuilders} from '../../doc/DocBuilders';
import {DocUtils} from '../../doc/DocUtils';

const {concat, hardline} = DocBuilders;

export class EmbedHTML {
  static embed(path, print, textToDoc, options) {
    const node = path.getValue();

    switch(node.type) {
      case 'text': {
        const parent = path.getParentNode();
        // Inline JavaScript
        if(
          parent.type === 'script' &&
          ((!parent.attribs.lang && !parent.attribs.lang) ||
            parent.attribs.type === 'text/javascript' ||
            parent.attribs.type === 'application/javascript')
        ) {
          const parser = options.parser === 'flow' ? 'flow' : 'babylon';
          const doc = textToDoc(EmbedHTML.getText(options, node), {parser});
          return concat([hardline, doc]);
        }

        // Inline TypeScript
        if(
          parent.type === 'script' &&
          (parent.attribs.type === 'application/x-typescript' ||
            parent.attribs.lang === 'ts')
        ) {
          const doc = textToDoc(
            EmbedHTML.getText(options, node),
            {parser: 'typescript'},
            options
          );
          return concat([hardline, doc]);
        }

        // Inline Styles
        if(parent.type === 'style') {
          const doc = textToDoc(EmbedHTML.getText(options, node), {parser: 'css'});
          return concat([hardline, DocUtils.stripTrailingHardline(doc)]);
        }

        break;
      }

      case 'attribute': {
        /*
         * Vue binding sytax: JS expressions
         * :class="{ 'some-key': value }"
         * v-bind:id="'list-' + id"
         * v-if="foo && !bar"
         * @click="someFunction()"
         */
        if(/(^@)|(^v-)|:/.test(node.key) && !/^\w+$/.test(node.value)) {
          const doc = textToDoc(node.value, {
            parser: EmbedHTML.parseJavaScriptExpression,
            // Use singleQuote since HTML attributes use double-quotes.
            // TODO(azz): We still need to do an entity escape on the attribute.
            singleQuote: true
          });
          return concat([
            node.key,
            '="',
            Util.hasNewlineInRange(node.value, 0, node.value.length)
              ? doc
              : DocUtils.removeLines(doc),
            '"'
          ]);
        }
      }
      default:
        break;
    }
  }

  static parseJavaScriptExpression(text, parsers) {
    // Force parsing as an expression
    const ast = parsers.babylon(`(${text})`);
    // Extract expression from the declaration
    return {
      program: ast.program.body[0].expression,
      type: 'File'
    };
  }

  static getText(options, node) {
    return options.originalText.slice(
      options.locStart(node),
      options.locEnd(node)
    );
  }
}
