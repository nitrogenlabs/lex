import {defineConfig} from 'vitest/config';
import base from './vitest.config.mjs';
export default defineConfig({...base, test: {...base.test, dir: '.', include: ['src/commands/publish/*.test.ts'], coverage: {enabled: true, reportsDirectory: 'coverage/publish', include: ['src/commands/publish/publish.ts'], reporter: ['text', 'json'], thresholds: {perFile: true, branches: 90, functions: 90, lines: 90, statements: 90}}}});
