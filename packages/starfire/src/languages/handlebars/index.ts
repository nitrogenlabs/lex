import {PrinterGlimmer} from './PrinterGlimmer';

// Based on:
// https://github.com/github/linguist/blob/master/lib/linguist/languages.yml

export class LanguageGlimmer {
  static languages = [
    {
      ace_mode: 'handlebars',
      aliases: ['hbs', 'htmlbars'],
      extensions: ['.handlebars', '.hbs'],
      group: 'HTML',
      language_id: 155,
      since: '0.0.0',
      tm_scope: 'text.html.handlebars',
      type: 'markup'
    }
  ];

  static parsers = {
    glimmer: {
      get parse() {
        return require('./ParserGlimmer').ParserGlimmer.parse;
      },
      astFormat: 'glimmer',
      locEnd(node) {
        return node.loc && node.loc.end;
      },
      locStart(node) {
        return node.loc && node.loc.start;
      }
    }
  };

  static printers = {
    glimmer: PrinterGlimmer
  };
}
