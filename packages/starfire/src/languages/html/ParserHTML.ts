export class ParserHTML {
  static parse(text /* , parsers, opts*/) {
    // Inline the require to avoid loading all the JS if we don't use it
    const parse5 = require('parse5');

    try {
      const isFragment: boolean = !/^\s*<(!doctype|html|head|body|!--)/i.test(text);
      const ast = (isFragment ? parse5.parseFragment : parse5.parse)(text, {
        locationInfo: true,
        treeAdapter: parse5.treeAdapters.htmlparser2
      });
      return ParserHTML.extendAst(ast);
    } catch(error) {
      throw error;
    }
  }

  static extendAst(ast) {
    if(!ast || !ast.children) {
      return ast;
    }

    for(const child of ast.children) {
      ParserHTML.extendAst(child);

      if(child.attribs) {
        child.attributes = ParserHTML.convertAttribs(child.attribs);
      }
    }
    return ast;
  }

  static convertAttribs(attribs) {
    return Object.keys(attribs).map((attributeKey) => ({
      key: attributeKey,
      type: 'attribute',
      value: attribs[attributeKey]
    }));
  }
}
