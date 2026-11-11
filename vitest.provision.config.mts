import {defineConfig} from 'vitest/config';

// eslint-disable-next-line import/extensions -- The producer base configuration is an actual ESM .mjs file.
import base from './vitest.config.mjs';

export default defineConfig({...base, test: {...base.test,
  coverage: {enabled: true, include: ['src/commands/provision/provision.ts'], provider: 'v8',
    reporter: ['text', 'json-summary'], reportsDirectory: 'coverage/provision',
    thresholds: {branches: 90, functions: 90, lines: 90, perFile: true, statements: 90}},
  dir: '.', include: ['src/commands/provision/provision.test.ts']}});
