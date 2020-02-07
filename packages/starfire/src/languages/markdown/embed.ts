import {Support} from '../../common/Support';
import {Util} from '../../common/Util';
import {DocBuilders} from '../../doc/DocBuilders';


const {concat, hardline, literalline, markAsRoot} = DocBuilders;

export class EmbedMarkdown {
  static embed(path, print, textToDoc, options) {
    const node = path.getValue();
    const getParserName = () => {
      const supportInfo = Support.getSupportInfo(null, {
        plugins: options.plugins,
        pluginsLoaded: true
      });
      const language = supportInfo.languages
        .find((supportLanguage) => supportLanguage.name.toLowerCase() === supportLanguage
          || (supportLanguage.extensions && supportLanguage.extensions
            .find((ext) => ext.substring(1) === supportLanguage)));

      if(language) {
        return language.parsers[0];
      }

      return null;
    };
    const replaceNewlinesWithLiterallines = (doc) => Util.mapDoc(
      doc,
      (currentDoc) =>
        (typeof currentDoc === 'string' && currentDoc.includes('\n')
          ? concat(
            currentDoc
              .split(/(\n)/g)
              .map((line: string, index: number) => (index % 2 === 0 ? line : literalline))
          )
          : currentDoc)
    );

    if(node.type === 'code') {
      // only look for the first string so as to support [markdown-preview-enhanced](https://shd101wyy.github.io/markdown-preview-enhanced/#/code-chunk)
      const lang = node.lang.split(/\s/, 1)[0];
      const parser = getParserName(lang);
      if(parser) {
        const styleUnit = options.__inJsTemplate ? '~' : '`'; // eslint-disable-line
        const style = styleUnit.repeat(
          Math.max(3, Util.getMaxContinuousCount(node.value, styleUnit) + 1)
        );
        const doc = textToDoc(node.value, {parser});
        return markAsRoot(
          concat([
            style,
            node.lang,
            hardline,
            replaceNewlinesWithLiterallines(doc),
            style
          ])
        );
      }
    }

    return null;
  }
}
