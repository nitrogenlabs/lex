import {Util} from '../../common/Util';
import {options} from './options';
import {PrinterCSS} from './PrinterCSS';

const {getLast, lineColumnToIndex} = Util;

// Based on:
// https://github.com/github/linguist/blob/master/lib/linguist/languages.yml

export class LanguageCSS {
  static options = options;

  static languages = [
    {
      aceMode: 'css',
      codemirrorMimeType: 'text/css',
      codemirrorMode: 'css',
      extensions: ['.css', '.pcss', '.postcss'],
      group: 'CSS',
      liguistLanguageId: 50,
      name: 'CSS',
      parsers: ['css'],
      since: '0.0.0',
      tmScope: 'source.css',
      vscodeLanguageIds: ['css']
    },
    {
      aceMode: 'less',
      codemirrorMimeType: 'text/css',
      codemirrorMode: 'css',
      extensions: ['.less'],
      group: 'CSS',
      liguistLanguageId: 198,
      name: 'Less',
      parsers: ['less'],
      since: '0.0.0',
      tmScope: 'source.css.less',
      vscodeLanguageIds: ['less']
    },
    {
      aceMode: 'scss',
      codemirrorMimeType: 'text/x-scss',
      codemirrorMode: 'css',
      extensions: ['.scss'],
      group: 'CSS',
      liguistLanguageId: 329,
      name: 'SCSS',
      parsers: ['scss'],
      since: '0.0.0',
      tmScope: 'source.scss',
      vscodeLanguageIds: ['scss']
    }
  ];

  static css = {
    get parse() {
      return require('./ParserCSS').ParserCSS.parse;
    },
    astFormat: 'css',
    locEnd(node) {
      const endNode = node.nodes && getLast(node.nodes);

      if(endNode && node.source && !node.source.end) {
        node = endNode;
      }

      if(node.source) {
        return lineColumnToIndex(node.source.end, node.source.input.css);
      }

      return null;
    },
    locStart(node) {
      if(node.source) {
        return lineColumnToIndex(node.source.start, node.source.input.css) - 1;
      }

      return null;
    }
  };

  // TODO: switch these to just `css` and use `language` instead.
  static parsers = {
    css: LanguageCSS.css,
    less: LanguageCSS.css,
    scss: LanguageCSS.css
  };

  static printers = {
    css: PrinterCSS
  };
}
