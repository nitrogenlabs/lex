import assert from 'assert';

import {FastPath} from '../common/FastPath';
import {DocBuilders} from '../doc/DocBuilders';
import {DocUtils} from '../doc/DocUtils';
import {Comments} from './Comments';
import {MultiParser} from './MultiParser';

const {addAlignmentToDoc, concat, hardline} = DocBuilders;

export class AstToDoc {
  static printAstToDoc(ast, options, addAlignmentSize: number = 0) {
    const {printer} = options;
    const cache = new Map();
    const printGenerically = (path, args?) => {
      const node = path.getValue();
      const shouldCache: boolean = node && typeof node === 'object' && args === undefined;

      if(shouldCache && cache.has(node)) {
        return cache.get(node);
      }

      // We let JSXElement print its comments itself because it adds () around
      // UnionTypeAnnotation has to align the child without the comments
      let res;

      if(printer.willPrintOwnComments && printer.willPrintOwnComments(path)) {
        res = AstToDoc.genericPrint(path, options, printGenerically, args);
      } else {
        res = Comments.printComments(
          path,
          (print) => AstToDoc.genericPrint(print, options, printGenerically, args),
          options,
          args && args.needsSemi
        );
      }

      if(shouldCache) {
        cache.set(node, res);
      }

      return res;
    };

    let printDoc = printGenerically(new FastPath(ast));

    if(addAlignmentSize > 0) {
      // Add a hardline to make the indents take effect. It should be removed in index.js format()
      printDoc = addAlignmentToDoc(
        DocUtils.removeLines(concat([hardline, printDoc])),
        addAlignmentSize,
        options.tabWidth
      );
    }

    DocUtils.propagateBreaks(printDoc);

    if(options.parser === 'json') {
      printDoc = concat([printDoc, hardline]);
    }

    return printDoc;
  }

  static genericPrint(path, options, printPath, args) {
    assert.ok(path instanceof FastPath);

    const node = path.getValue();
    const {locEnd, locStart, originalText, printer} = options;

    // Escape hatch
    if(printer.hasStarfireIgnore && printer.hasStarfireIgnore(path)) {
      return originalText.slice(locStart(node), locEnd(node));
    }

    if(node) {
      try {
        // Potentially switch to a different parser
        const sub = MultiParser.printSubtree(path, printPath, options);

        if(sub) {
          return sub;
        }
      } catch(error) {
        /* istanbul ignore if */
        if(process.env.STARFIRE_DEBUG) {
          throw error;
        }
        // Continue with current parser
      }
    }

    return printer.print(path, options, printPath, args);
  }
}
