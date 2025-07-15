# Testing the Compile Module

This document outlines the testing approach for the compile module in the Lex project.

## Test Files

The compile module includes three main test files:

1. `compile.cli.test.ts` - Tests for CLI functionality
2. `compile.integration.test.ts` - Integration tests
3. `compile.options.test.ts` - Tests for option handling

## Test Coverage

### CLI Tests

The CLI tests focus on:

- Command-line interface interactions
- Processing command arguments
- Basic functionality of the `hasFileType` and `compile` functions
- Error handling for command-line operations

### Integration Tests

The integration tests cover:

- Compilation workflow with TypeScript and ESBuild
- File processing with PostCSS
- Asset copying operations (images, fonts, markdown)
- Error handling during compilation process
- Watch mode functionality

### Options Tests

The options tests verify:

- Custom source and output paths
- CLI name customization
- Quiet mode
- Removal of output directory
- TypeScript configuration options
- Watch mode options

## Mocking Strategy

The tests extensively use Jest mocking to isolate components:

- `execa` is mocked to simulate command execution
- `fs` operations are mocked to avoid real filesystem interaction
- `glob` is mocked to provide consistent file lists
- `LexConfig` is mocked to provide configuration
- Spinner components are mocked to verify UI interactions
- URL handling is mocked to provide consistent paths

## Running Tests

To run the tests:

```bash
# Run all compile tests
npm test -- packages/lex/src/commands/compile

# Run specific test file
npm test -- packages/lex/src/commands/compile/compile.cli.test.ts
```

## Common Test Patterns

### Testing File Operations

```typescript
// Mock filesystem
(fs.existsSync as jest.Mock).mockReturnValue(true);
(fs.lstatSync as jest.Mock).mockReturnValue({
  isDirectory: () => false
});

// Test file type detection
expect(hasFileType('/test/path', ['.ts'])).toBe(true);
```

### Testing Command Execution

```typescript
// Mock execa
(execa as unknown as jest.Mock).mockResolvedValue({
  stdout: 'success',
  stderr: ''
});

// Execute the compile function
const result = await compile(cmdOptions, mockCallback);

// Verify command was executed
expect(execa).toHaveBeenCalledWith(
  '/node_modules/esbuild/bin/esbuild',
  expect.arrayContaining(['--color=true']),
  expect.anything()
);
```

### Testing Error Handling

```typescript
// Mock execa to throw an error
(execa as unknown as jest.Mock).mockImplementationOnce(() => {
  throw new Error('Error message');
});

// Execute and verify error handling
const result = await compile(cmdOptions, mockCallback);
expect(mockSpinner.fail).toHaveBeenCalled();
expect(result).toBe(1);
```

## Test Edge Cases

Key edge cases tested include:

- Handling non-existent source directories
- Processing empty file lists
- Handling compilation errors
- Customizing toolchain configurations
- Supporting various project structures 