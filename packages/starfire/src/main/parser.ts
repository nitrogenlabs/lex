import path from 'path';

import {ConfigError} from '../common/errors/ConfigError';
import {LanguageJS} from '../languages/js';
import {SFParserType} from '../types/doc';
import {SFLanguageOptionsType} from '../types/options';

const {locStart, locEnd} = LanguageJS;

export class Parser {
  static getParsers(options: SFLanguageOptionsType) {
    return options.plugins.reduce((parsers, plugin) => ({...parsers, ...plugin.parsers}), {});
  }

  static resolveParser(opts, parsers?): SFParserType {
    const {parser} = opts;
    const updatedParsers = parsers ? {...parsers} : Parser.getParsers(opts);
    if(typeof parser === 'function') {
      // Custom parser API always works with JavaScript.
      return {astFormat: 'estree', locEnd, locStart, parse: parser};
    }

    if(typeof parser === 'string') {
      if(updatedParsers.hasOwnProperty(parser)) {
        return parsers[parser];
      }
      try {
        return {astFormat: 'estree', locEnd, locStart, parse: require(path.resolve(process.cwd(), parser))};
      } catch(err) {
        /* istanbul ignore next */
        throw new ConfigError(`Couldn't resolve parser "${parser}"`);
      }
    }

    /* istanbul ignore next */
    return parsers.typescript;
  }

  static parse(text: string, opts) {
    const parsers = Parser.getParsers(opts);

    // Copy the "parse" function from parser to a new object whose values are
    // functions. Use defineProperty()/getOwnPropertyDescriptor() such that we
    // don't invoke the parser.parse getters.
    const parsersForCustomParserApi = Object.keys(parsers).reduce(
      (object, parserName) =>
        Object.defineProperty(
          object,
          parserName,
          Object.getOwnPropertyDescriptor(parsers[parserName], 'parse')
        ),
      {}
    );

    const {preprocess, parse} = Parser.resolveParser(opts, parsers);
    let updatedText: string = text;

    try {
      if(preprocess) {
        updatedText = preprocess(updatedText, opts);
      }

      return {ast: parse(updatedText, parsersForCustomParserApi, opts), text: updatedText};
    } catch(error) {
      const {loc} = error;

      if(loc) {
        const codeFrame = require('@babel/code-frame');
        error.codeFrame = codeFrame.codeFrameColumns(text, loc, {
          highlightCode: true
        });
        error.message += `\n${error.codeFrame}`;
        throw error;
      }

      /* istanbul ignore next */
      throw error.stack;
    }
  }
}
