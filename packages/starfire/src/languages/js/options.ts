// Format based on https://github.com/starfire/starfire/blob/master/src/common/support.js
const CATEGORY_JAVASCRIPT = 'JavaScript';

export const options = {
  arrowParens: {
    category: CATEGORY_JAVASCRIPT,
    choices: [
      {description: 'Omit parens when possible. Example: `x => x`', value: 'avoid'},
      {description: 'Always include parens. Example: `(x) => x`', value: 'always'}
    ],
    default: 'always',
    description: 'Include parentheses around a sole arrow function parameter.',
    since: '0.0.0',
    type: 'choice'
  },
  bracketSpacing: {
    category: CATEGORY_JAVASCRIPT,
    default: false,
    description: 'Insert spaces between brackets.',
    oppositeDescription: 'Do not insert spaces between brackets.',
    since: '0.0.0',
    type: 'boolean'
  },
  jsxBracketSameLine: {
    category: CATEGORY_JAVASCRIPT,
    default: true,
    description: 'Put > on the last line instead of at a new line.',
    since: '0.0.0',
    type: 'boolean'
  },
  keywordSpacing: {
    category: CATEGORY_JAVASCRIPT,
    default: false,
    description: 'Insert space after keyword.',
    oppositeDescription: 'Do not insert space after keyword.',
    since: '0.0.0',
    type: 'boolean'
  },
  semi: {
    category: CATEGORY_JAVASCRIPT,
    default: true,
    description: 'Print semicolons.',
    oppositeDescription: 'Do not print semicolons, except at the beginning of lines which may need them.',
    since: '0.0.0',
    type: 'boolean'
  },
  singleQuote: {
    category: CATEGORY_JAVASCRIPT,
    default: true,
    description: 'Use single quotes instead of double quotes.',
    since: '0.0.0',
    type: 'boolean'
  },
  trailingComma: {
    category: CATEGORY_JAVASCRIPT,
    choices: [
      {description: 'No trailing commas.', value: 'none'},
      {description: 'Trailing commas where valid in ES5 (objects, arrays, etc.)', value: 'es5'},
      {description: 'Trailing commas wherever possible (including function arguments).', value: 'all'}
    ],
    default: [
      {since: '0.0.0', value: 'none'}
    ],
    description: 'Print trailing commas wherever possible when multi-line.',
    since: '0.0.0',
    type: 'choice'
  }
};
