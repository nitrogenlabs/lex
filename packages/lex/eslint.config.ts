import { typescriptConfig } from 'eslint-config-styleguidejs';

const config: any = [
  ...typescriptConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      parserOptions: {
        project: '../../tsconfig.lint.json'
      }
    }
  }
];

export default config;
