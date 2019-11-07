import {options as jsOptions} from '../js/options';

const CATEGORY_MARKDOWN = 'Markdown';

// format based on https://github.com/starfire/starfire/blob/master/src/common/support.js
export const options = {
  proseWrap: {
    category: CATEGORY_MARKDOWN,
    choices: [
      {description: 'Wrap prose if it exceeds the print width.', since: '0.0.0', value: 'always'},
      {description: 'Do not wrap prose.', since: '0.0.0', value: 'never'},
      {description: 'Wrap prose as-is.', since: '0.0.0', value: 'preserve'}
    ],
    default: [{since: '0.0.0', value: 'preserve'}],
    description: 'How to wrap prose. (markdown)',
    since: '0.0.0',
    type: 'choice'
  },
  singleQuote: jsOptions.singleQuote
};
