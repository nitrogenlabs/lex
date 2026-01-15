import styleguideConfig from 'eslint-config-styleguidejs';

export default [
  ...styleguideConfig,
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
