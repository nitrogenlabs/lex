import fs from 'fs';
import {wrap as raw} from 'jest-snapshot-serializer-raw';
import path from 'path';

const {AST_COMPARE, TEST_STANDALONE, TEST_CRLF} = process.env;
const CURSOR_PLACEHOLDER = '<|>';
const RANGE_START_PLACEHOLDER = '<<<STARFIRE_RANGE_START>>>';
const RANGE_END_PLACEHOLDER = '<<<STARFIRE_RANGE_END>>>';

const Starfire = !TEST_STANDALONE
  ? require('starfire/local')
  : require('starfire/standalone');

const parse = (source, options) => Starfire.debug.parse(source, options, true).ast;

const format = (source, filepath: string, options) => {
  const result = Starfire.formatWithCursor(source, {filepath, ...options});

  return options.cursorOffset >= 0
    ? result.formatted.slice(0, result.cursorOffset) +
    CURSOR_PLACEHOLDER +
    result.formatted.slice(result.cursorOffset)
    : result.formatted;
};

const consistentEndOfLine = (text: string) => {
  let firstEndOfLine;

  return text.replace(/\r\n?|\n/g, (endOfLine) => {
    if(!firstEndOfLine) {
      firstEndOfLine = endOfLine;
    }

    return firstEndOfLine;
  });
};

const visualizeEndOfLine = (text: string) => text.replace(/\r\n?|\n/g, (endOfLine) => {
  switch(endOfLine) {
    case '\n':
      return '<LF>\n';
    case '\r\n':
      return '<CRLF>\n';
    case '\r':
      return '<CR>\n';
    default:
      throw new Error(`Unexpected end of line ${JSON.stringify(endOfLine)}`);
  }
});

const printSeparator = (width, description = '') => {
  const leftLength: number = Math.floor((width - description.length) / 2);
  const rightLength: number = width - leftLength - description.length;
  return '='.repeat(leftLength) + description + '='.repeat(rightLength);
};

const stringify = (value): string => {
  if(value === Infinity) {
    return 'Infinity';
  } else if(Array.isArray(value)) {
    return `[${value.map((v) => JSON.stringify(v)).join(', ')}]`;
  }

  return JSON.stringify(value);
};

const printOptions = (options) => {
  const keys = Object.keys(options).sort();
  return keys.map((key) => `${key}: ${stringify(options[key])}`).join('\n');
};

const omit = (obj, fn) => Object.keys(obj).reduce((reduced, key) => {
  const value = obj[key];
  if(!fn(key, value)) {
    reduced[key] = value;
  }
  return reduced;
}, {});

const createSnapshot = (input, output, options) => {
  const separatorWidth: number = 80;
  const printWidthIndicator =
    options.printWidth > 0 && Number.isFinite(options.printWidth)
      ? `${' '.repeat(options.printWidth)}| printWidth`
      : [];
  return []
    .concat(
      printSeparator(separatorWidth, 'options'),
      printOptions(
        omit(
          options,
          (k) => k === 'rangeStart' || k === 'rangeEnd' || k === 'cursorOffset'
        )
      ),
      printWidthIndicator,
      printSeparator(separatorWidth, 'input'),
      input,
      printSeparator(separatorWidth, 'output'),
      output,
      printSeparator(separatorWidth)
    )
    .join('\n');
};

export const runSpec = (dirname: string, parsers: any, options: any = {}) => {
  if(!parsers || !parsers.length) {
    throw new Error(`No parsers were specified for ${dirname}`);
  }

  fs.readdirSync(dirname)
    .forEach((basename: string) => {
      const filename: string = path.join(dirname, basename);

      if(
        path.extname(basename) === '.snap'
        || !fs.lstatSync(filename).isFile()
        || basename[0] === '.'
        || basename === 'jsfmt.spec.ts'
      ) {
        return;
      }

      let rangeStart: number;
      let rangeEnd: number;
      let cursorOffset: number;

      const text = fs.readFileSync(filename, 'utf8');

      const source = (TEST_CRLF ? text.replace(/\n/g, '\r\n') : text)
        .replace(RANGE_START_PLACEHOLDER, (match, offset) => {
          rangeStart = offset;
          return '';
        })
        .replace(RANGE_END_PLACEHOLDER, (match, offset) => {
          rangeEnd = offset;
          return '';
        });
      const input = source.replace(CURSOR_PLACEHOLDER, (match, offset) => {
        cursorOffset = offset;
        return '';
      });

      const baseOptions = {
        printWidth: 80,
        ...options,
        rangeStart,
        rangeEnd,
        cursorOffset
      };
      const mainOptions = {
        ...baseOptions,
        parser: parsers[0]
      };

      const hasEndOfLine: boolean = 'endOfLine' in mainOptions;

      const output = format(input, filename, mainOptions);
      const visualizedOutput = visualizeEndOfLine(output);

      test(basename, () => {
        expect(visualizedOutput).toEqual(
          visualizeEndOfLine(consistentEndOfLine(output))
        );
        expect(
          raw(
            createSnapshot(
              hasEndOfLine
                ? visualizeEndOfLine(
                  text
                    .replace(RANGE_START_PLACEHOLDER, '')
                    .replace(RANGE_END_PLACEHOLDER, '')
                )
                : source,
              hasEndOfLine ? visualizedOutput : output,
              {...baseOptions, parsers}
            )
          )
        ).toMatchSnapshot();
      });

      for(const parser of parsers.slice(1)) {
        const verifyOptions = {...baseOptions, parser};

        test(`${basename} - ${parser}-verify`, () => {
          const verifyOutput = format(input, filename, verifyOptions);
          expect(visualizedOutput).toEqual(visualizeEndOfLine(verifyOutput));
        });
      }

      if(AST_COMPARE) {
        test(`${filename} parse`, () => {
          const parseOptions = {...mainOptions};
          delete parseOptions.cursorOffset;

          const originalAst = parse(input, parseOptions);
          let formattedAst;

          expect(() => {
            formattedAst = parse(
              output.replace(CURSOR_PLACEHOLDER, ''),
              parseOptions
            );
          }).not.toThrow();
          expect(originalAst).toEqual(formattedAst);
        });
      }
    });
};
