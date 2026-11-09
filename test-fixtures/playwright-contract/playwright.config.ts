import {defineConfig} from '@nlabs/lex/test-playwright';
import type {PlaywrightTestConfig} from '@nlabs/lex/test-playwright';

const config: PlaywrightTestConfig = defineConfig({fullyParallel: false, retries: 0, testDir: '.',
  testMatch: 'contract.e2e.ts', workers: 1});
export default config;
