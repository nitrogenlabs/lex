import { typescriptConfig } from 'eslint-config-styleguidejs';

export default [
  ...typescriptConfig,
  {
    rules: {
      'no-plusplus': 'off'
    }
  }
];
