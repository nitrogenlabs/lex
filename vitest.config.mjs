/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {existsSync} from 'fs';
import merge from 'lodash/merge.js';
import {resolve} from 'path';
import {defineConfig} from 'vitest/config';

let projectVitestConfig = null;

if(process.env.LEX_CONFIG) {
  try {
    const lexConfig = JSON.parse(process.env.LEX_CONFIG);
    projectVitestConfig = lexConfig.vitest;
  } catch(error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to parse LEX_CONFIG:', error.message);
  }
}

const setupOverride = process.env.LEX_VITEST_SETUP;
const defaultSetupFile = resolve(process.cwd(), 'vitest.setup.js');
const setupFile = setupOverride || defaultSetupFile;
const setupFiles = setupFile && existsSync(setupFile) ? [setupFile] : [];

const baseConfig = defineConfig({
  resolve: {
    alias: [
      {
        find: /^(\.{1,2}\/.*)\.js$/,
        replacement: '$1'
      }
    ]
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec,integration}.{ts,tsx,js,jsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/lib/**'],
    setupFiles,
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['html', 'text'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/lib/**',
        '**/__snapshots__/**',
        '**/*.d.ts'
      ]
    }
  }
});

const finalConfig = projectVitestConfig && Object.keys(projectVitestConfig).length > 0
  ? merge(baseConfig, {test: projectVitestConfig})
  : baseConfig;

export default finalConfig;
