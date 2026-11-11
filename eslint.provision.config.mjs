import config from './eslint.config.mjs';

const files = ['src/commands/provision/*.ts'];
export default [{ignores: ['**/*', '!**/', ...files.map((file) => `!${file}`)]}, ...config];
