export default {test: {environment: 'node', include: ['src/test-playwright/index.test.ts'],
  coverage: {enabled: true, include: ['src/test-playwright/index.ts'], provider: 'v8', reporter: ['text'],
    thresholds: {branches: 90, functions: 90, lines: 90, statements: 90}}}};
