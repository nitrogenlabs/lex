import {defineConfig} from 'vitest/config';
import base from './vitest.config.mjs';
export default defineConfig({...base, test: {...base.test, dir: '.', coverage: {exclude: ['**/*.test.ts', '**/*.e2e.ts', '**/*.types.ts'], reporter: ['text', 'json'], include: ['src/utils/deployment/*.ts', 'src/commands/deployment-env/{arguments,deployment-env}.ts'], thresholds: {branches: 90, functions: 90, lines: 90, perFile: true, statements: 90}}, include: ['src/utils/deployment/*.test.ts', 'src/commands/deployment-env/*.test.ts']}});
