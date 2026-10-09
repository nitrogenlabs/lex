import {defineConfig} from 'vitest/config';
import base from './vitest.config.mjs';
export default defineConfig({...base, test: {...base.test, dir: '.', include: ['src/commands/native-*/*.test.ts', 'src/utils/native/*.test.ts'], coverage: {enabled: true, reportsDirectory: 'coverage/native', include: ['src/commands/native-*/*.ts', 'src/utils/native/*.ts'], exclude: ['**/*.test.ts', '**/*.types.ts', '**/*.e2e.ts'], reporter: ['text','json'], thresholds: {perFile:true,branches:90,functions:90,lines:90,statements:90}}}});
