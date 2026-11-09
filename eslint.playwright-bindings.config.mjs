import {typescriptConfig} from 'eslint-config-styleguidejs';

const files = ['src/test-playwright/*.ts', 'scripts/verify-playwright-contract.mjs'];
export default [{ignores: ['**/*', '!**/', ...files.map((file) => `!${file}`)]}, ...typescriptConfig,
  {files: ['scripts/verify-playwright-contract.mjs'], languageOptions: {parserOptions: {
    projectService: {allowDefaultProject: ['scripts/verify-playwright-contract.mjs']}, tsconfigRootDir: import.meta.dirname
  }}}];
