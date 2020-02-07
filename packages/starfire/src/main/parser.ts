import path from 'path';

import {ConfigError} from '../common/errors';
import {locEnd, locStart} from '../languages/js/loc';


// Use defineProperties()/getOwnPropertyDescriptor() to prevent
// triggering the parsers getters.
const ownNames = Object.getOwnPropertyNames;
const ownDescriptor = Object.getOwnPropertyDescriptor;

export const getParsers = (options) => {
  const parsers = {};
  for(const plugin of options.plugins) {
    if(!plugin.parsers) {
      continue;
    }

    for(const name of ownNames(plugin.parsers)) {
      Object.defineProperty(parsers, name, ownDescriptor(plugin.parsers, name));
    }
  }

  return parsers;
};

export const resolveParser = (opts, parsers?) => {
  const updatedParsers = parsers || getParsers(opts);

  if(typeof opts.parser === 'function') {
    // Custom parser API always works with JavaScript.
    return {
      parse: opts.parser,
      astFormat: 'estree',
      locStart,
      locEnd
    };
  }

  if(typeof opts.parser === 'string') {
    if(Object.prototype.hasOwnProperty.call(updatedParsers, opts.parser)) {
      return updatedParsers[opts.parser];
    }

    /* istanbul ignore next */
    if(process.env.PRETTIER_TARGET === 'universal') {
      throw new ConfigError(
        `Couldn't resolve parser "${opts.parser}". Parsers must be explicitly added to the standalone bundle.`
      );
    } else {
      try {
        return {
          parse: eval('require')(path.resolve(process.cwd(), opts.parser)),
          astFormat: 'estree',
          locStart,
          locEnd
        };
      } catch(err) {
        /* istanbul ignore next */
        throw new ConfigError(`Couldn't resolve parser "${opts.parser}"`);
      }
    }
  }
};

export const parse = (text: string, opts) => {
  const parsers = getParsers(opts);
  let updateText: string = text;

  // Create a new object {parserName: parseFn}. Uses defineProperty() to only call
  // the parsers getters when actually calling the parser `parse` function.
  const parsersForCustomParserApi = Object.keys(parsers).reduce(
    (object, parserName) =>
      Object.defineProperty(object, parserName, {
        enumerable: true,
        get() {
          return parsers[parserName].parse;
        }
      }),
    {}
  );

  const parser = resolveParser(opts, parsers);

  try {
    if(parser.preprocess) {
      updateText = parser.preprocess(updateText, opts);
    }

    return {
      text: updateText,
      ast: parser.parse(updateText, parsersForCustomParserApi, opts)
    };
  } catch(error) {
    const {loc} = error;

    if(loc) {
      const codeFrame = require('@babel/code-frame');
      error.codeFrame = codeFrame.codeFrameColumns(updateText, loc, {
        highlightCode: true
      });
      error.message += `\n${error.codeFrame}`;
      throw error;
    }

    /* istanbul ignore next */
    throw error.stack;
  }
};
