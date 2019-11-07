import {options} from './options';
import {PrinterMarkdown} from './PrinterMarkdown';

// Based on:
// https://github.com/github/linguist/blob/master/lib/linguist/languages.yml

export class LanguageMarkdown {
  static options = options;
  static languages = [
    {
      aceMode: 'markdown',
      aliases: ['pandoc'],
      codemirrorMimeType: 'text/x-gfm',
      codemirrorMode: 'gfm',
      extensions: [
        '.md',
        '.markdown',
        '.mdown',
        '.mdwn',
        '.mkd',
        '.mkdn',
        '.mkdown',
        '.ron',
        '.workbook'
      ],
      filenames: ['README'],
      linguistLanguageId: 222,
      name: 'Markdown',
      parsers: ['remark'],
      since: '1.8.0',
      tmScope: 'source.gfm',
      vscodeLanguageIds: ['markdown'],
      wrap: true
    }
  ];

  static remark = {
    get parse() {
      return require('./ParserMarkdown').ParserMarkdown.parse;
    },
    astFormat: 'mdast'
  };

  static parsers = {
    markdown: LanguageMarkdown.remark,
    remark: LanguageMarkdown.remark
  };

  static printers = {
    mdast: PrinterMarkdown
  };
}
