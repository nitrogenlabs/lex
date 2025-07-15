# Lint Module Test Documentation

This document describes the testing approach for the `lint.ts` module.

## Testing Strategy

The lint module is tested with three separate test files:

1. **CLI Tests** (`lint.cli.test.ts`): Tests the command-line interface functionality.
2. **Integration Tests** (`lint.integration.test.ts`): Tests interactions between components and external dependencies.
3. **Options Tests** (`lint.options.test.ts`): Tests handling of different lint options.

## CLI Tests

The CLI tests focus on:
- Basic command execution with default options
- Error handling for linting failures
- Implementation of TypeScript detection
- Package.json modification for ESM support
- ESLint configuration creation and handling

## Integration Tests

The integration tests validate:
- Finding and using Lex's ESLint config when no project config exists
- Creating and cleaning up temporary configs 
- AI-powered fixes for linting errors and fallbacks
- Special case handling (e.g., no files found)
- Running ESLint for both JS and TS files

## Options Tests

The options tests verify:
- Proper application of command-line flags like `--fix` and `--debug`
- Custom config path handling
- AI fixing capabilities
- Output handling with the `quiet` flag
- Custom CLI name support

## Mocking Strategy

The lint module has several external dependencies that are mocked in tests:

- **execa**: Mocked to control execution of ESLint commands
- **fs**: Mocked to simulate file system operations
- **path**: Mocked for consistent path handling
- **url**: Mocked to provide a consistent file path
- **app.js**: Mocked for spinner functionality
- **log.js**: Mocked to capture log output
- **aiService.js**: Mocked to simulate AI-powered fixes
- **LexConfig.js**: Mocked for AI configuration

## Test Coverage

The tests cover the following key areas:

1. **ESLint Configuration**
   - Detection of existing configs
   - Creation of temporary configs
   - Restoring original configs

2. **TypeScript Support**
   - Detection of TypeScript projects
   - Running ESLint with TypeScript settings

3. **AI Integration**
   - Using AI for fixing linting errors
   - Fallback to rule-based fixes when AI is unavailable

4. **Error Handling**
   - Handling ESLint failures
   - Managing edge cases like no files found

5. **Command Line Options**
   - Processing and applying various ESLint options
   - Custom configuration options 