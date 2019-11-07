import {PrinterHTML} from './PrinterHTML';

// Based on:
// https://github.com/github/linguist/blob/master/lib/linguist/languages.yml
export class LanguageHTML {
  static languages = [
    {
      aceMode: 'html',
      aliases: ['xhtml'],
      codemirrorMimeType: 'text/html',
      codemirrorMode: 'htmlmixed',
      extensions: ['.html', '.htm', '.html.hl', '.inc', '.st', '.xht', '.xhtml'],
      group: 'HTML',
      linguistLanguageId: 146,
      name: 'HTML',
      parsers: ['parse5'],
      since: '0.0.0',
      tmScope: 'text.html.basic',
      vscodeLanguageIds: ['html']
    }
  ];

  static get parsers() {
    return {
      parse5: {
        get parse() {
          return require('./ParserHTML').ParserHTML.parse;
        },
        astFormat: 'htmlparser2',
        locEnd: (node) => node.__location && node.__location.endOffset,
        locStart: (node) => node.__location && node.__location.startOffset
      }
    };
  }

  static printers = {
    htmlparser2: PrinterHTML
  };
}
