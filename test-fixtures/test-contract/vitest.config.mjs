export default {
  test: {
    coverage: {
      enabled: true,
      include: ['subject.ts'],
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      thresholds: {branches: 100, functions: 100, lines: 100, statements: 100}
    },
    environment: 'node',
    globals: true,
    include: ['core.test.ts', 'hoisted.test.ts', 'react.test.ts']
  }
};
