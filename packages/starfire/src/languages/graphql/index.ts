import {options} from './options';
import {PrinterGraphql} from './PrinterGraphql';

// Based on:
// https://github.com/github/linguist/blob/master/lib/linguist/languages.yml
export class LanguageGraphql {
  static options = options;

  static languages = [
    {
      aceMode: 'text',
      extensions: ['.graphql', '.gql'],
      liguistLanguageId: 139,
      name: 'GraphQL',
      parsers: ['graphql'],
      since: '0.0.0',
      tmScope: 'source.graphql',
      vscodeLanguageIds: ['graphql']
    }
  ];

  static parsers = {
    graphql: {
      get parse() {
        return require('./ParserGraphql').ParserGraphql.parse;
      },
      astFormat: 'graphql',
      locStart(node) {
        if(typeof node.start === 'number') {
          return node.start;
        }
        return node.loc && node.loc.start;
      },
      locEnd(node) {
        if(typeof node.end === 'number') {
          return node.end;
        }
        return node.loc && node.loc.end;
      }
    }
  };

  static printers = {
    graphql: PrinterGraphql
  };
}
