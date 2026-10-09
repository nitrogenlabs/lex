import {defineConfig} from 'vitest/config';

export default defineConfig({test: {coverage: {enabled: true, include: ['src/commands/serverless-deploy/serverless-deploy.ts'], provider: 'v8', reporter: ['text', 'json-summary'], thresholds: {branches: 90, functions: 90, lines: 90, perFile: true, statements: 90}}, environment: 'node', include: ['src/commands/serverless-deploy/*.test.ts']}});
