/**
 * Copyright (c) 2025-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 *
 * PostCSS 8-compatible version of postcss-percentage plugin
 * Original: https://github.com/antyakushev/postcss-percentage
 */
import Mexp from 'math-expression-evaluator';
import parser from 'postcss-value-parser';

interface PostcssPercentageOptions {
  floor?: boolean;
  precision?: number;
  trimTrailingZero?: boolean;
}

const transformPercentage = (
  value: string,
  precision: number,
  floor: boolean | undefined,
  trimTrailingZero: boolean | undefined
): string => {
  // @ts-expect-error - Mexp default export type issue
  const evaluator = new Mexp();
  return parser(value).walk((node) => {
    if(node.type !== 'function' || node.value !== 'percentage') {
      return;
    }

    const result = evaluator.eval(parser.stringify(node.nodes)) * 100;
    let resultStr: string;
    if(result === 0) {
      resultStr = '0';
    } else if(floor) {
      const resultString = result.toString();
      const index = resultString.indexOf('.');
      resultStr = index === -1
        ? resultString
        : resultString.substring(0, index + 1 + precision);
    } else {
      resultStr = result.toFixed(precision);
    }
    if(trimTrailingZero) {
      resultStr = resultStr
        .replace(/\.0+$/, '')
        .replace(/(\.\d*[1-9])0+$/, '$1');
    }
    resultStr += '%';
    // eslint-disable-next-line no-restricted-properties
    Object.assign(node, {
      type: 'word' as const,
      value: resultStr
    });
  }).toString();
};

const postcssPercentage = (opts: PostcssPercentageOptions = {}) => {
  const options = {
    floor: opts.floor,
    precision: opts.precision === null || opts.precision === undefined || opts.precision > 20 || opts.precision < 0
      ? 6
      : opts.precision,
    trimTrailingZero: opts.trimTrailingZero === null || opts.trimTrailingZero === undefined
      ? true
      : opts.trimTrailingZero
  };

  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Once(root, {result}) {
      root.walkDecls((decl) => {
        if(!decl.value || !/percentage\s*\(/.test(decl.value)) {
          return;
        }

        try {
          decl.value = transformPercentage(
            decl.value,
            options.precision,
            options.floor,
            options.trimTrailingZero
          );
        } catch(e) {
          const error = e as Error;
          decl.warn(result, error.message, {
            index: decl.index,
            word: decl.value
          });
        }
      });
    },
    postcssPlugin: 'postcss-percentage'
  };
};

postcssPercentage.postcss = true;

export default postcssPercentage;

