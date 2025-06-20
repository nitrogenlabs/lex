# Init Command Tests

The init command tests are organized into three categories:

## CLI Tests (`init.cli.test.ts`)

These tests focus on the command-line interface aspects of the `init` command:

- Verifying that the command correctly processes command-line arguments
- Testing default behavior when no options are provided
- Testing each option individually
- Testing error handling for various failure scenarios
- Verifying that the command returns the correct exit codes

Key test cases:
- Initializing an app with default options
- Using TypeScript or Flow templates based on configuration
- Installing dependencies when requested
- Using custom package manager
- Using custom CLI name
- Handling download errors
- Handling file system errors
- Handling installation errors

## Integration Tests (`init.integration.test.ts`)

These tests verify that the `init` command works correctly as a whole:

- Testing the complete workflow from template download to app creation
- Verifying that TypeScript and Flow templates are used correctly
- Testing with custom templates
- Testing with and without dependency installation
- Verifying error handling for various failure scenarios

Key test cases:
- Creating a TypeScript project
- Creating a Flow project
- Using a custom template package
- Skipping dependency installation
- Handling download and installation errors

## Options Tests (`init.options.test.ts`)

These tests focus on verifying that the command accepts and processes all supported options:

- Testing each option individually
- Testing combinations of options
- Verifying default values when options are not provided

Key test cases:
- Testing the `cliName` option
- Testing the `install` option
- Testing the `packageManager` option
- Testing the `quiet` option
- Testing the `typescript` option
- Testing all options together

## Mocking Strategy

The tests use the following mocks to isolate the `init` command functionality:

- `execa`: Mocked to simulate package download and dependency installation
- `fs`: Mocked to simulate file system operations
- `path`: Mocked to simplify path resolution
- `LexConfig`: Mocked to provide configuration values
- `app.js`: Mocked to simulate spinner and package.json operations
- `log.js`: Mocked to capture log messages

## Test Coverage

The tests aim to cover:

- All code paths in the `init` function
- All options and their combinations
- All error handling scenarios
- Edge cases like empty package names 