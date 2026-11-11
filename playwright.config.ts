/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  projects: [
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']}
    }
  ],
  reporter: process.env.CI ? [['list'], ['html', {open: 'never'}]] : 'list',
  retries: process.env.CI ? 2 : 0,
  testDir: './src',
  testIgnore: ['**/node_modules/**', '**/dist/**', '**/lib/**'],
  testMatch: '**/*.e2e.{ts,tsx,js,jsx}',
  use: {
    trace: 'retain-on-failure'
  }
});
