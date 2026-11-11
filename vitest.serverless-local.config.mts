import {defineConfig} from 'vitest/config';

import base from './vitest.config.mjs';

export default defineConfig({...base, test: {...base.test, coverage: {enabled: true,
  include: ['src/serverless-local/http.ts', 'src/serverless-local/runtime.ts', 'src/commands/serverless-dev/localHttp.ts'],
  provider: 'v8', reporter: ['text', 'json'], reportsDirectory: 'coverage/serverless-local',
  thresholds: {branches: 90, functions: 90, lines: 90, perFile: true, statements: 90}},
dir: '.', include: ['src/serverless-local/*.test.ts', 'src/commands/serverless-dev/localHttp.test.ts',
  'src/commands/serverless-dev/serverless-dev.local.test.ts']}});
