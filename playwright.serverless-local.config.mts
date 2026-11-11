import {defineConfig} from '@playwright/test';

export default defineConfig({fullyParallel: false, reporter: 'list', retries: 0,
  testDir: 'src/commands/serverless-dev', testMatch: 'serverless-dev.local.e2e.ts', workers: 1});
