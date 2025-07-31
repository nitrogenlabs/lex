import {typescriptConfig} from 'eslint-config-styleguidejs';

export default [
  ...typescriptConfig,
  {
    ignores: ['*.md'],
    rules: {
      'keyword-spacing': ['error', {
        after: true,
        before: true,
        overrides: {
          for: {after: false},
          if: {after: false},
          switch: {after: false},
          while: {after: false}
        }
      }],
      'space-before-blocks': ['error', {
        classes: 'always',
        functions: 'always',
        keywords: 'always'
      }]
    }
  }
];
