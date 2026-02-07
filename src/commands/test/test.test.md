# Testing the Test Module

This document outlines the testing approach for the test module in the Lex project.

## Test Files

The test module includes three main test files:

1. `test.cli.test.ts` - Tests for CLI functionality
2. `test.integration.test.ts` - Integration tests for Vitest execution and AI features
3. `test.options.test.ts` - Tests for the various Vitest options

## Test Coverage

### CLI Tests

The CLI tests focus on:

- The `getTestFilePatterns` utility function
- Basic test execution via Vitest
- Error handling for failed test runs
- AI integration for test generation
- AI integration for test analysis
- AI integration for test debugging

### Integration Tests

The integration tests cover:

- Proper Vitest configuration for different test scenarios
- AI test generation for uncovered source files
- AI test analysis with proper test results
- AI debugging assistance for failing tests
- Handling combinations of AI options
- Error handling during test execution and AI operations
- Support for custom command-line arguments

### Options Tests

The options tests verify:

- Vitest flag handling for all supported options
- Custom CLI naming
- TypeScript integration
- Custom configuration files
- Setup file handling
- Watch mode options
- Snapshot update handling

## Mocking Strategy

The tests extensively use Vitest mocking to isolate testing components:

- `execa` is mocked to simulate Vitest execution
- `fs` operations are mocked for file reading
- `glob` is mocked to provide consistent file patterns
- `LexConfig` is mocked to provide configuration
- Spinner components are mocked for UI interactions
- AI module is mocked to simulate AI interactions

## Running Tests

To run the tests:

```bash
# Run all test module tests
npm test -- src/commands/test

# Run specific test file
npm test -- src/commands/test/test.cli.test.ts
```

## Common Test Patterns

### Testing Vitest Option Handling

```typescript
it('should pass option to Vitest when specified', async () => {
  const options = {
    quiet: false,
    optionToTest: true
  };

  await test(options, [], mockCallback as unknown as typeof process.exit);

  const vitestArgs = (execa as unknown as Mock).mock.calls[0][1];
  expect(vitestArgs).toContain('--optionFlag');
});
```

### Testing AI Integration

```typescript
it('should integrate with AI for test generation', async () => {
  const options = {
    quiet: false,
    generate: true
  };

  await test(options, [], mockCallback as unknown as typeof process.exit);

  expect(ai.ai).toHaveBeenCalledWith(expect.objectContaining({
    task: 'test',
    prompt: expect.stringContaining('Generate Vitest unit tests')
  }));
});
```

### Testing Error Handling

```typescript
it('should handle Vitest execution errors', async () => {
  const options = { quiet: false };

  (execa as unknown as Mock).mockRejectedValueOnce({
    message: 'Vitest error'
  });

  const result = await test(options, [], mockCallback);

  expect(result).toBe(1);
  expect(mockCallback).toHaveBeenCalledWith(1);
});
```

## Key Test Scenarios

1. **Basic Vitest Execution** - Verifying that Vitest is executed with the correct configuration
2. **Option Handling** - Testing that all options are properly converted to Vitest CLI flags
3. **AI Test Generation** - Verifying that AI can generate tests for uncovered source files
4. **AI Test Analysis** - Testing the AI coverage analysis feature
5. **AI Debugging Assistance** - Verifying the AI debugging feature for failing tests
6. **Error Handling** - Testing graceful failure modes for various error scenarios

## Mock Setup

Key mocks include:

1. **File System Mocks** - To simulate reading test files and results
2. **Glob Mocks** - To simulate finding source and test files
3. **Execa Mocks** - To simulate Vitest execution and capture command-line arguments
4. **AI Mocks** - To verify AI prompt construction and task execution
