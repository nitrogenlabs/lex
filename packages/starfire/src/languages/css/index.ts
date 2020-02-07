import cloneDeep from 'lodash/cloneDeep';

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
      let updatedNode = cloneDeep(node);
      const endNode = updatedNode.nodes && getLast(updatedNode.nodes);

      if(endNode && updatedNode.source && !updatedNode.source.end) {
        updatedNode = endNode;
      }

      if(updatedNode.source) {
        return lineColumnToIndex(updatedNode.source.end, updatedNode.source.input.css);
      }

      return null;
    },
    locStart(node) {
      const updatedNode = cloneDeep(node);

      if(updatedNode.source) {
        return lineColumnToIndex(updatedNode.source.start, updatedNode.source.input.css) - 1;
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
