import {typescriptConfig} from 'eslint-config-styleguidejs';

export default [
  ...typescriptConfig,
  {
    ignores: ['*.md'],
    rules: {
      'space-before-blocks': ['error', {
        classes: 'always',
        functions: 'always',
        keywords: 'always'
      }]
    }
  }
];
