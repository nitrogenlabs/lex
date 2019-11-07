import {Util} from '../../common/Util';
import {options} from './options';
import {PragmaJS} from './PragmaJS';
import {PrinterJS} from './PrinterJS';

// Based on:
// https://github.com/github/linguist/blob/master/lib/linguist/languages.yml
export class LanguageJS {
  static options = options;
  static printers = {estree: PrinterJS};

  static locStart(node) {
    // Handle nodes with decorators. They should start at the first decorator
    if(node.declaration && node.declaration.decorators && node.declaration.decorators.length > 0) {
      return LanguageJS.locStart(node.declaration.decorators[0]);
    }

    if(node.decorators && node.decorators.length > 0) {
      return LanguageJS.locStart(node.decorators[0]);
    }

    if(node.__location) {
      return node.__location.startOffset;
    }

    if(node.range) {
      return node.range[0];
    }

    if(typeof node.start === 'number') {
      return node.start;
    }

    if(node.loc) {
      return node.loc.start;
    }

    return null;
  }

  static locEnd(node) {
    const endNode = node.nodes && Util.getLast(node.nodes);

    if(endNode && node.source && !node.source.end) {
      node = endNode;
    }

    let loc;

    if(node.range) {
      loc = node.range[1];
    } else if(typeof node.end === 'number') {
      loc = node.end;
    }

    if(node.__location) {
      return node.__location.endOffset;
    }

    if(node.typeAnnotation) {
      return Math.max(loc, LanguageJS.locEnd(node.typeAnnotation));
    }

    if(node.loc && !loc) {
      return node.loc.end;
    }

    return loc;
  }

  static languages = [
    {
      aceMode: 'javascript',
      aliases: ['js', 'node'],
      codemirrorMimeType: 'text/javascript',
      codemirrorMode: 'javascript',
      extensions: [
        '.js',
        '._js',
        '.bones',
        '.es',
        '.es6',
        '.frag',
        '.gs',
        '.jake',
        '.jsb',
        '.jscad',
        '.jsfl',
        '.jsm',
        '.jss',
        '.mjs',
        '.njs',
        '.pac',
        '.sjs',
        '.ssjs',
        '.xsjs',
        '.xsjslib'
      ],
      filenames: ['Jakefile'],
      group: 'JavaScript',
      linguistLanguageId: 183,
      name: 'JavaScript',
      parsers: ['babylon', 'flow'],
      since: '0.0.0',
      tmScope: 'source.js',
      vscodeLanguageIds: ['javascript']
    },
    {
      aceMode: 'javascript',
      codemirrorMimeType: 'text/jsx',
      codemirrorMode: 'jsx',
      extensions: ['.jsx'],
      group: 'JavaScript',
      liguistLanguageId: 178,
      name: 'JSX',
      parsers: ['babylon', 'flow'],
      since: '0.0.0',
      tmScope: 'source.js.jsx',
      vscodeLanguageIds: ['javascriptreact']
    },
    {
      aceMode: 'typescript',
      aliases: ['ts'],
      codemirrorMimeType: 'application/typescript',
      codemirrorMode: 'javascript',
      extensions: ['.ts', '.tsx'],
      group: 'JavaScript',
      liguistLanguageId: 378,
      name: 'TypeScript',
      parsers: ['typescript-eslint'],
      since: '0.0.0',
      tmScope: 'source.ts',
      vscodeLanguageIds: ['typescript', 'typescriptreact']
    },
    {
      aceMode: 'json',
      codemirrorMimeType: 'application/json',
      codemirrorMode: 'javascript',
      extensions: [
        '.json',
        '.json5',
        '.geojson',
        '.JSON-tmLanguage',
        '.topojson'
      ],
      filenames: [
        '.arcconfig',
        '.jshintrc',
        '.babelrc',
        '.eslintrc',
        '.starfirerc',
        'composer.lock',
        'mcmod.info'
      ],
      group: 'JavaScript',
      linguistLanguageId: 174,
      name: 'JSON',
      parsers: ['json'],
      since: '1.5.0',
      tmScope: 'source.json',
      vscodeLanguageIds: ['json', 'jsonc']
    }
  ];

  static get typescript() {
    return {
      get parse() {
        return require('./ParserTypescript').ParserTypescript.parse;
      },
      astFormat: 'estree',
      hasPragma: PragmaJS.hasPragma,
      locEnd: LanguageJS.locEnd,
      locStart: LanguageJS.locStart
    };
  }

  static get babylon() {
    return {
      get parse() {
        return require('./ParserBabylon').ParserBabylon.parse;
      },
      astFormat: 'estree',
      hasPragma: PragmaJS.hasPragma,
      locEnd: LanguageJS.locEnd,
      locStart: LanguageJS.locStart
    };
  }

  static get parsers() {
    const {babylon, locEnd, locStart, typescript} = LanguageJS;
    const {hasPragma} = PragmaJS;

    return {
      babylon,
      flow: {
        get parse() {
          return require('./ParserFlow').ParserFlow.parse;
        },
        astFormat: 'estree',
        hasPragma,
        locEnd,
        locStart
      },
      json: {
        ...babylon,
        hasPragma() {
          return false;
        }
      },
      typescript,
      'typescript-eslint': typescript
    };
  }
}
