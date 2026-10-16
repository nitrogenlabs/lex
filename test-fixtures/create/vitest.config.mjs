export default {
  test: {
    coverage: {
      enabled: true,
      include: ['src/commands/create/create.ts'],
      provider: 'v8',
      reportOnFailure: true,
      reporter: ['text', 'json', 'json-summary'],
      reportsDirectory: '.artifacts/fix1-coverage',
      thresholds: {branches: 90, functions: 90, lines: 90, statements: 90}
    },
    environment: 'node',
    globals: true,
    include: ['src/commands/create/*.test.ts', 'src/commands/storybook/storybook.cli.test.ts']
  }
};
