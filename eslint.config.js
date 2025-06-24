import { typescriptConfig } from 'eslint-config-styleguidejs';

export default [
  ...typescriptConfig,
  {
    files: ['**/*.test.ts', '**/*.test.js'],
    rules: {
      'import/no-extraneous-dependencies': ['error', {devDependencies: true}],
      'no-plusplus': 'off'
    }
  }
];
