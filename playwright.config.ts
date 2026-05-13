/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.e2e.{ts,tsx,js,jsx}',
  testIgnore: ['**/node_modules/**', '**/dist/**', '**/lib/**'],
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', {open: 'never'}]] : 'list',
  use: {
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']}
    }
  ]
});
